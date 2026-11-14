// Syncs sanitized workout telemetry from a self-hosted openGym state file or
// JSON backup into src/data/opengym.json, or pushes directly from a Raspberry Pi
// cron job to a secret GitHub Gist + triggers a Vercel Deploy Hook when workouts change.
//
// Zero npm dependencies (Node >= 18). Safe to copy as a single standalone file onto the Pi.
//
// Strips body weight, progress photos, passkeys, and exact clock timestamps —
// keeping only calendar dates (YYYY-MM-DD), routine names, working sets, PR
// counts, session duration (minutes), and aggregate volume.
//
// Usage:
//   Local snapshot:
//     node scripts/sync-opengym.mjs [pathToStateJsonOrDataDir] [--out path/to/out.json]
//
//   One-time secret Gist creation:
//     OPENGYM_GIST_TOKEN=ghp_xxx node scripts/sync-opengym.mjs [pathToStateOrDataDir] --init-gist
//
//   Raspberry Pi cron (push to Gist + trigger Vercel build only when workouts change):
//     OPENGYM_GIST_ID=... OPENGYM_GIST_TOKEN=... VERCEL_DEPLOY_HOOK_URL=... \
//       node sync-opengym.mjs /path/to/openGym/data --push [--force]

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultSrc = process.env.OPENGYM_DATA
  ? path.resolve(process.env.OPENGYM_DATA)
  : path.resolve(repoRoot, "..", "openGym", "data");
const defaultDest = path.join(repoRoot, "src", "data", "opengym.json");
const defaultHashFile = process.env.OPENGYM_HASH_FILE
  ? path.resolve(process.env.OPENGYM_HASH_FILE)
  : path.join(__dirname, ".opengym-sync.hash");

function parseArgs(argv) {
  let src = defaultSrc;
  let out = defaultDest;
  let outExplicit = false;
  let push = false;
  let initGist = false;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out" && argv[i + 1]) {
      out = path.resolve(argv[++i]);
      outExplicit = true;
    } else if (arg === "--push") {
      push = true;
    } else if (arg === "--init-gist") {
      initGist = true;
    } else if (arg === "--force") {
      force = true;
    } else if (!arg.startsWith("--")) {
      src = path.resolve(arg);
    }
  }
  return { src, out, outExplicit, push, initGist, force };
}

function localIso(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function addDays(iso, delta) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return localIso(d);
}

function sundayOfWeek(iso) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() - d.getDay());
  return localIso(d);
}

function isWarmupSet(set) {
  return set?.phase === "warmup" || set?.warmup === true;
}

function completedSetUnits(set) {
  if (!set || isWarmupSet(set)) return 0;
  if (set.sides?.L && set.sides?.R) {
    return (set.sides.L.done ? 1 : 0) + (set.sides.R.done ? 1 : 0);
  }
  return set.done || set.doneL || set.doneR ? 1 : 0;
}

function workoutWorkingSets(workout) {
  let total = 0;
  for (const entry of workout?.entries || []) {
    for (const set of entry?.sets || []) {
      total += completedSetUnits(set);
    }
  }
  return total;
}

function workoutVolumeLoad(workout) {
  // Prefer openGym's own cached work-set volume (accounts for per-bell dumbbells & unilateral sets).
  if (typeof workout?.vol === "number" && Number.isFinite(workout.vol) && workout.vol >= 0) {
    return workout.vol;
  }
  let vol = 0;
  for (const entry of workout?.entries || []) {
    for (const set of entry?.sets || []) {
      if (completedSetUnits(set) === 0) continue;
      const w = Number(set.w) || 0;
      const r = Number(set.r) || 0;
      if (w > 0 && r > 0) vol += w * r;
    }
  }
  return vol;
}

async function resolveStateFile(srcPath) {
  const stat = await fs.stat(srcPath).catch(() => null);
  if (!stat) {
    throw new Error(`Source path not found: ${srcPath}`);
  }
  if (stat.isFile()) return srcPath;

  const envUid = (process.env.OPENGYM_UID || "").trim();
  if (envUid) {
    if (!/^[a-zA-Z0-9_-]+$/.test(envUid)) {
      throw new Error(`Invalid OPENGYM_UID: ${envUid}`);
    }
    return path.join(srcPath, `state-${envUid}.json`);
  }

  const files = (await fs.readdir(srcPath)).filter((f) =>
    /^state-[a-zA-Z0-9_-]+\.json$/.test(f),
  );
  if (files.length === 1) return path.join(srcPath, files[0]);
  if (files.length === 0) {
    throw new Error(
      `No state-<uid>.json found in ${srcPath}. Pass a state JSON file or openGym export JSON explicitly.`,
    );
  }
  throw new Error(
    `Multiple profiles found in ${srcPath}; set OPENGYM_UID=<uid> or pass the exact state-<uid>.json path.`,
  );
}

export function summarizeOpenGymState(rawState, todayIso = localIso(new Date())) {
  // Support both raw state-<uid>.json and wrapped backup exports ({ state: { ... } }).
  const state =
    rawState && typeof rawState.state === "object" && Array.isArray(rawState.state.workouts)
      ? rawState.state
      : rawState;

  if (!state || !Array.isArray(state.workouts)) {
    throw new Error("Input JSON does not contain a valid openGym workouts[] array.");
  }

  const unit = state.unit === "lb" ? "lb" : "kg";
  const tonnesDivisor = unit === "lb" ? 2204.62262 : 1000;

  const routinesById = new Map(
    (state.routines || []).map((r) => [r.id, r.name || "Workout"]),
  );

  // Valid finished sessions up to today, chronological.
  const valid = state.workouts
    .filter(
      (w) =>
        typeof w?.d === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(w.d) &&
        w.d <= todayIso,
    )
    .map((w) => {
      const sets = workoutWorkingSets(w);
      const volumeKg = workoutVolumeLoad(w) / tonnesDivisor; // metric tonnes
      const rawMin =
        Number.isFinite(w.start) && Number.isFinite(w.end) && w.end > w.start
          ? Math.max(1, Math.round((w.end - w.start) / 60000))
          : null;
      // Omit duration when a full workout was quick-logged retrospectively in a couple of minutes.
      const durationMin = rawMin !== null && !(rawMin < 10 && sets >= 8) ? rawMin : null;
      const prs = Array.isArray(w.prs) ? w.prs.length : Number(w.prs) || 0;
      const routine =
        (typeof w.name === "string" && w.name.trim()) ||
        (w.routineId && routinesById.get(w.routineId)) ||
        "Session";
      return { date: w.d, routine, sets, tonnes: volumeKg, durationMin, prs };
    })
    .filter((w) => w.sets > 0 || w.durationMin !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const yearStart = `${todayIso.slice(0, 4)}-01-01`;
  const d90Start = addDays(todayIso, -89);
  const w52Start = addDays(sundayOfWeek(todayIso), -51 * 7);
  const earliestDate = valid[0]?.date || null;

  function computeWindow(fromIso, toIso) {
    const items = valid.filter((w) => w.date >= fromIso && w.date <= toIso);
    const sessions = items.length;
    const sets = items.reduce((sum, w) => sum + w.sets, 0);
    const tonnageRaw = items.reduce((sum, w) => sum + w.tonnes, 0);
    // Anchor weekly average to the first logged session if history began inside the window.
    const effectiveFrom =
      earliestDate && earliestDate > fromIso ? earliestDate : fromIso;
    const spanDays = Math.max(
      7,
      Math.round(
        (new Date(toIso + "T12:00:00") - new Date(effectiveFrom + "T12:00:00")) /
          86400000,
      ) + 1,
    );
    const weeks = spanDays / 7;
    return {
      sessions,
      avgPerWeek: Number((sessions / weeks).toFixed(1)),
      sets,
      tonnage: Number(tonnageRaw.toFixed(1)),
      avgTonnage: sessions > 0 ? Number((tonnageRaw / sessions).toFixed(2)) : 0,
    };
  }

  // Weekly streak (weeks with >= 3 sessions, Sunday-aligned).
  const minPerWeek = 3;
  const sessionsByWeek = new Map();
  for (const w of valid) {
    const wk = sundayOfWeek(w.date);
    sessionsByWeek.set(wk, (sessionsByWeek.get(wk) || 0) + 1);
  }

  let bestWeeks = 0;
  if (sessionsByWeek.size > 0) {
    const earliestWeek = [...sessionsByWeek.keys()].sort()[0];
    const currentWeek = sundayOfWeek(todayIso);
    let run = 0;
    for (
      let cursor = earliestWeek;
      cursor <= currentWeek;
      cursor = addDays(cursor, 7)
    ) {
      if ((sessionsByWeek.get(cursor) || 0) >= minPerWeek) {
        run += 1;
        if (run > bestWeeks) bestWeeks = run;
      } else {
        run = 0;
      }
    }
  }

  let currentWeeks = 0;
  const thisWeek = sundayOfWeek(todayIso);
  let checkWeek =
    (sessionsByWeek.get(thisWeek) || 0) >= minPerWeek
      ? thisWeek
      : addDays(thisWeek, -7);
  while ((sessionsByWeek.get(checkWeek) || 0) >= minPerWeek) {
    currentWeeks += 1;
    checkWeek = addDays(checkWeek, -7);
  }

  // Collapse multiple workouts on the same calendar day into a single public entry.
  const byDay = new Map();
  for (const w of valid) {
    if (w.date < w52Start) continue;
    const prev = byDay.get(w.date);
    if (!prev) {
      byDay.set(w.date, {
        date: w.date,
        routine: w.routine,
        sets: w.sets,
        durationMin: w.durationMin,
        prs: w.prs,
      });
    } else {
      prev.routine = `${prev.routine} + ${w.routine}`;
      prev.sets += w.sets;
      prev.durationMin =
        prev.durationMin !== null || w.durationMin !== null
          ? (prev.durationMin || 0) + (w.durationMin || 0)
          : null;
      prev.prs += w.prs;
    }
  }

  const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));

  // Workout-only fingerprint (excludes syncedAt and rolling window boundaries so rest
  // days never trigger Gist updates or Vercel builds).
  const hash = crypto.createHash("sha256");
  hash.update(`unit:${unit}\n`);
  for (const w of valid) {
    hash.update(
      `${w.date}|${w.routine}|${w.sets}|${w.tonnes.toFixed(3)}|${w.durationMin ?? ""}|${w.prs}\n`,
    );
  }
  const fingerprint = `sha256:${hash.digest("hex").slice(0, 16)}`;

  return {
    syncedAt: todayIso,
    sourceHost: process.env.OPENGYM_SOURCE_HOST || "arcadia",
    fingerprint,
    unit,
    streak: {
      currentWeeks,
      bestWeeks: Math.max(bestWeeks, currentWeeks),
      minPerWeek,
    },
    activeDays52w: days.length,
    windows: {
      ytd: computeWindow(yearStart, todayIso),
      d90: computeWindow(d90Start, todayIso),
    },
    days,
  };
}

function githubHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "tapanmeena-opengym-sync",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchRemoteFingerprint(gistId, token, filename) {
  const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const gist = await res.json();
  const file = gist?.files?.[filename];
  if (!file) return null;
  const content = file.truncated && file.raw_url
    ? await (await fetch(file.raw_url, { signal: AbortSignal.timeout(10000) })).text()
    : file.content;
  if (!content) return null;
  try {
    return JSON.parse(content)?.fingerprint || null;
  } catch {
    return null;
  }
}

async function createSecretGist(summary, token, filename) {
  if (!token) {
    throw new Error("OPENGYM_GIST_TOKEN is required for --init-gist (GitHub PAT with Gists read/write).");
  }
  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: "Sanitized openGym telemetry for tapanmeena.com (/life)",
      public: false,
      files: {
        [filename]: {
          content: JSON.stringify(summary, null, 2) + "\n",
        },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to create Gist (${res.status}): ${body.slice(0, 200)}`);
  }
  const created = await res.json();
  console.log(`Created secret Gist: ${created.html_url}`);
  console.log(`OPENGYM_GIST_ID=${created.id}`);
}

async function pushToGistAndDeploy(summary, { force, out, outExplicit }) {
  const gistId = (process.env.OPENGYM_GIST_ID || "").trim();
  const token = (process.env.OPENGYM_GIST_TOKEN || "").trim();
  const filename = (process.env.OPENGYM_GIST_FILENAME || "opengym.json").trim();
  const deployHook = (process.env.VERCEL_DEPLOY_HOOK_URL || "").trim();

  if (!gistId || !token) {
    throw new Error("OPENGYM_GIST_ID and OPENGYM_GIST_TOKEN must be set when using --push.");
  }

  if (!force) {
    const lastHash = (await fs.readFile(defaultHashFile, "utf8").catch(() => "")).trim();
    if (lastHash && lastHash === summary.fingerprint) {
      console.log(`[opengym] Unchanged (${summary.fingerprint}) — skipping Gist push & deploy.`);
      return;
    }

    // If local hash cache was cleared (e.g. reboot), check the remote Gist before rebuilding.
    if (!lastHash) {
      const remoteFp = await fetchRemoteFingerprint(gistId, token, filename).catch(() => null);
      if (remoteFp && remoteFp === summary.fingerprint) {
        await fs.writeFile(defaultHashFile, summary.fingerprint + "\n", "utf8").catch(() => {});
        console.log(`[opengym] Matches remote Gist (${summary.fingerprint}) — cached hash, skipping deploy.`);
        return;
      }
    }
  }

  const payload = JSON.stringify(summary, null, 2) + "\n";
  if (outExplicit) {
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, payload, "utf8");
  }

  const patchRes = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
    method: "PATCH",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [filename]: { content: payload },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!patchRes.ok) {
    const errText = await patchRes.text().catch(() => "");
    throw new Error(`Gist PATCH failed (${patchRes.status}): ${errText.slice(0, 200)}`);
  }
  console.log(
    `[opengym] Updated Gist ${gistId.slice(0, 6)}… (${filename}) -> ${summary.fingerprint}`,
  );

  if (deployHook) {
    const hookRes = await fetch(deployHook, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
    });
    if (!hookRes.ok) {
      const errText = await hookRes.text().catch(() => "");
      throw new Error(`Vercel Deploy Hook failed (${hookRes.status}): ${errText.slice(0, 200)}`);
    }
    console.log("[opengym] Triggered Vercel Deploy Hook.");
  }

  // Persist hash only after both Gist update and Deploy Hook succeed so transient failures retry.
  await fs.writeFile(defaultHashFile, summary.fingerprint + "\n", "utf8");
}

async function main() {
  const { src, out, outExplicit, push, initGist, force } = parseArgs(process.argv.slice(2));
  const statePath = await resolveStateFile(src);
  const raw = JSON.parse(await fs.readFile(statePath, "utf8"));
  const summary = summarizeOpenGymState(raw);

  if (initGist) {
    const token = (process.env.OPENGYM_GIST_TOKEN || "").trim();
    const filename = (process.env.OPENGYM_GIST_FILENAME || "opengym.json").trim();
    await createSecretGist(summary, token, filename);
    return;
  }

  if (push) {
    await pushToGistAndDeploy(summary, { force, out, outExplicit });
    return;
  }

  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(
    `Synced ${summary.windows.ytd.sessions} YTD sessions (${summary.days.length} active days in 52w) -> ${path.relative(repoRoot, out)}`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
