// Build-time fetcher for sanitized openGym telemetry stored in a secret GitHub Gist.
// Runs automatically via `prebuild` before `astro build` on Vercel.
//
// Reads via the GitHub Gists API (rather than gist.githubusercontent.com raw URLs,
// which Fastly caches for up to 5 minutes) so a build triggered immediately after
// a workout always sees the fresh payload.
//
// Environment variables (set in Vercel Project Settings -> Environment Variables):
//   OPENGYM_GIST_ID       — Required to enable remote fetch (e.g. "a1b2c3d4...")
//   OPENGYM_GIST_TOKEN    — Optional (recommended on Vercel to avoid shared-IP 60/hr rate limit)
//   OPENGYM_GIST_FILENAME — Optional, defaults to "opengym.json"
//
// Never fails the build: if unset or unreachable, falls back cleanly to the
// committed src/data/opengym.json snapshot.

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const destPath = path.join(repoRoot, "src", "data", "opengym.json");

async function loadLocalDotEnvIfNeeded() {
  if (process.env.OPENGYM_GIST_ID) return;
  for (const name of [".env.local", ".env"]) {
    const raw = await fs.readFile(path.join(repoRoot, name), "utf8").catch(() => null);
    if (!raw) continue;
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

function isValidSnapshot(data) {
  return (
    Boolean(data) &&
    typeof data === "object" &&
    typeof data.syncedAt === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(data.syncedAt) &&
    typeof data.windows?.ytd?.sessions === "number" &&
    typeof data.windows?.d90?.sessions === "number" &&
    typeof data.streak?.currentWeeks === "number" &&
    Array.isArray(data.days)
  );
}

async function fetchFromGist(gistId, token, filename) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "tapanmeena-blog-prebuild",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`GitHub Gist API returned HTTP ${res.status}`);
  }

  const gist = await res.json();
  const file = gist?.files?.[filename];
  if (!file) {
    throw new Error(`File "${filename}" not found in Gist ${gistId}`);
  }

  // When truncated, file.raw_url includes the exact revision SHA (uncached / immutable).
  if (file.truncated && file.raw_url) {
    const rawRes = await fetch(file.raw_url, { signal: AbortSignal.timeout(8000) });
    if (!rawRes.ok) {
      throw new Error(`Gist raw_url returned HTTP ${rawRes.status}`);
    }
    return JSON.parse(await rawRes.text());
  }

  if (typeof file.content !== "string") {
    throw new Error(`Gist file "${filename}" returned empty content`);
  }
  return JSON.parse(file.content);
}

async function main() {
  await loadLocalDotEnvIfNeeded();
  const gistId = (process.env.OPENGYM_GIST_ID || "").trim();
  const token = (process.env.OPENGYM_GIST_TOKEN || "").trim();
  const filename = (process.env.OPENGYM_GIST_FILENAME || "opengym.json").trim();

  if (!gistId) {
    console.log("[opengym] OPENGYM_GIST_ID not set — using committed src/data/opengym.json.");
    return;
  }

  try {
    const snapshot = await fetchFromGist(gistId, token, filename);
    if (!isValidSnapshot(snapshot)) {
      throw new Error("Fetched Gist JSON failed schema validation");
    }

    await fs.writeFile(destPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
    console.log(
      `[opengym] Pulled fresh Gist snapshot (${snapshot.syncedAt}, ${snapshot.windows.ytd.sessions} YTD sessions) -> src/data/opengym.json`,
    );
  } catch (err) {
    console.warn(
      `[opengym] Warning: could not fetch Gist ${gistId.slice(0, 6)}… (${err.message || err}) — falling back to committed src/data/opengym.json.`,
    );
  }
}

main();
