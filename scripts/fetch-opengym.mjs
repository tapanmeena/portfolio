// Build-time fetcher for sanitized openGym + Tome telemetry stored in a secret GitHub Gist.
// Runs automatically via `prebuild` before `astro build` on Vercel.
//
// Reads via the GitHub Gists API (rather than gist.githubusercontent.com raw URLs,
// which Fastly caches for up to 5 minutes) so a build triggered immediately after
// a sync always sees the fresh payloads.
//
// Environment variables (set in Vercel Project Settings -> Environment Variables):
//   OPENGYM_GIST_ID       — Required to enable remote fetch (shared secret Gist by default)
//   OPENGYM_GIST_TOKEN    — Optional (recommended on Vercel to avoid shared-IP 60/hr rate limit)
//   OPENGYM_GIST_FILENAME — Optional, defaults to "opengym.json"
//   TOME_GIST_ID          — Optional override if Tome uses a separate Gist (defaults to OPENGYM_GIST_ID)
//   TOME_GIST_TOKEN       — Optional override (defaults to OPENGYM_GIST_TOKEN)
//   TOME_GIST_FILENAME    — Optional, defaults to "tome.json"
//
// Never fails the build: each file falls back independently to its committed
// snapshot in src/data/ if unset, missing, or unreachable.

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const openGymDest = path.join(repoRoot, "src", "data", "opengym.json");
const tomeDest = path.join(repoRoot, "src", "data", "tome.json");

async function loadLocalDotEnvIfNeeded() {
  if (process.env.OPENGYM_GIST_ID && process.env.TOME_GIST_ID) return;
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

function isValidOpenGymSnapshot(data) {
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

function isValidTomeSnapshot(data) {
  return (
    Boolean(data) &&
    typeof data === "object" &&
    typeof data.syncedAt === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(data.syncedAt) &&
    typeof data.windows?.ytd?.hours === "number" &&
    typeof data.windows?.d90?.hours === "number" &&
    typeof data.streak?.currentDays === "number" &&
    Array.isArray(data.currentlyReading) &&
    Array.isArray(data.stacks) &&
    Array.isArray(data.days)
  );
}

async function fetchGistObject(gistId, token) {
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
  return res.json();
}

async function extractFileFromGist(gist, filename) {
  const file = gist?.files?.[filename];
  if (!file) {
    throw new Error(`File "${filename}" not found in Gist`);
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
  const ogGistId = (process.env.OPENGYM_GIST_ID || "").trim();
  const ogToken = (process.env.OPENGYM_GIST_TOKEN || "").trim();
  const ogFilename = (process.env.OPENGYM_GIST_FILENAME || "opengym.json").trim();

  const tomeGistId = (process.env.TOME_GIST_ID || ogGistId).trim();
  const tomeToken = (process.env.TOME_GIST_TOKEN || ogToken).trim();
  const tomeFilename = (process.env.TOME_GIST_FILENAME || "tome.json").trim();

  const gistCache = new Map();
  async function getCachedGist(id, tok) {
    if (!gistCache.has(id)) {
      gistCache.set(id, fetchGistObject(id, tok));
    }
    return gistCache.get(id);
  }

  if (!ogGistId) {
    console.log("[opengym] OPENGYM_GIST_ID not set — using committed src/data/opengym.json.");
  } else {
    try {
      const gist = await getCachedGist(ogGistId, ogToken);
      const snapshot = await extractFileFromGist(gist, ogFilename);
      if (!isValidOpenGymSnapshot(snapshot)) {
        throw new Error("Fetched openGym JSON failed schema validation");
      }
      await fs.writeFile(openGymDest, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
      console.log(
        `[opengym] Pulled fresh Gist snapshot (${snapshot.syncedAt}, ${snapshot.windows.ytd.sessions} YTD sessions) -> src/data/opengym.json`,
      );
    } catch (err) {
      console.warn(
        `[opengym] Warning: could not fetch ${ogFilename} from Gist ${ogGistId.slice(0, 6)}… (${err.message || err}) — falling back to committed src/data/opengym.json.`,
      );
    }
  }

  if (!tomeGistId) {
    console.log("[tome] TOME_GIST_ID/OPENGYM_GIST_ID not set — using committed src/data/tome.json.");
  } else {
    try {
      const gist = await getCachedGist(tomeGistId, tomeToken);
      const snapshot = await extractFileFromGist(gist, tomeFilename);
      if (!isValidTomeSnapshot(snapshot)) {
        throw new Error("Fetched Tome JSON failed schema validation");
      }
      await fs.writeFile(tomeDest, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
      console.log(
        `[tome] Pulled fresh Gist snapshot (${snapshot.syncedAt}, ${snapshot.windows.ytd.hours}h YTD reading) -> src/data/tome.json`,
      );
    } catch (err) {
      console.warn(
        `[tome] Warning: could not fetch ${tomeFilename} from Gist ${tomeGistId.slice(0, 6)}… (${err.message || err}) — falling back to committed src/data/tome.json.`,
      );
    }
  }
}

main();
