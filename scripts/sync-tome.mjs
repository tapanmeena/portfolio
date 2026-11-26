// Syncs sanitized reading telemetry & shelves from a self-hosted Tome SQLite database
// (tome.db) into src/data/tome.json, or pushes directly from a Raspberry Pi cron job
// to a secret GitHub Gist + triggers a Vercel Deploy Hook when reading data changes.
//
// Zero npm dependencies (uses built-in node:sqlite in Node >= 22.5).
// Safe to copy as a single standalone file onto the Raspberry Pi.
//
// Privacy boundary:
//   - Strips exact clock timestamps (buckets into 4:00 AM local reading days),
//     CFI positions, client IPs/tokens, and private reviews.
//   - Exports annotations/highlights ONLY for books explicitly exposed via a non-expired
//     Tome Share Link (book, series, or saved shelf filter).
//
// Usage:
//   Local snapshot (from a tome.db file or Tome data directory):
//     node scripts/sync-tome.mjs [pathToTomeDbOrDataDir] [--out path/to/tome.json]
//
//   Raspberry Pi cron (push tome.json into existing secret Gist + trigger Vercel build):
//     node --env-file=/path/to/.opengym-sync.env sync-tome.mjs /path/to/Tome/data --push [--force]

import crypto from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultSrc = process.env.TOME_DATA
  ? path.resolve(process.env.TOME_DATA)
  : path.resolve(repoRoot, "..", "Tome", "data");
const defaultDest = path.join(repoRoot, "src", "data", "tome.json");
const defaultHashFile = process.env.TOME_HASH_FILE
  ? path.resolve(process.env.TOME_HASH_FILE)
  : path.join(__dirname, ".tome-sync.hash");

const TZ_NAME = process.env.TOME_TIMEZONE || "Asia/Kolkata";
const TZ_OFFSET_MIN = Number.isFinite(Number(process.env.TOME_TZ_OFFSET_MIN))
  ? Number(process.env.TOME_TZ_OFFSET_MIN)
  : 330; // +05:30 IST
const ROLLOVER_HOURS = Number.isFinite(Number(process.env.TOME_ROLLOVER_HOURS))
  ? Number(process.env.TOME_ROLLOVER_HOURS)
  : 4; // 04:00 AM reading-day rollover

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

function resolveDbPath(srcPath) {
  const stat = fsSync.statSync(srcPath, { throwIfNoEntry: false });
  if (!stat) {
    throw new Error(`Tome source path not found: ${srcPath}`);
  }
  if (stat.isFile()) return srcPath;
  const candidate = path.join(srcPath, "tome.db");
  if (fsSync.existsSync(candidate)) return candidate;
  throw new Error(`No tome.db found in directory: ${srcPath}`);
}

function utcIsoFromDate(d) {
  return (
    d.getUTCFullYear() +
    "-" +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getUTCDate()).padStart(2, "0")
  );
}

/**
 * Converts a Tome naive-UTC timestamp ("YYYY-MM-DD HH:MM:SS...") or JS Date
 * into a local reading-day "YYYY-MM-DD" using TZ_OFFSET_MIN and ROLLOVER_HOURS.
 */
function toReadingDayIso(utcInput) {
  if (!utcInput) return null;
  let ms;
  if (utcInput instanceof Date) {
    ms = utcInput.getTime();
  } else {
    const raw = String(utcInput).trim();
    if (!raw) return null;
    const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
    const withZone = /Z$|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`;
    ms = Date.parse(withZone);
  }
  if (!Number.isFinite(ms)) return null;
  const shiftedMs = ms + (TZ_OFFSET_MIN - ROLLOVER_HOURS * 60) * 60_000;
  return utcIsoFromDate(new Date(shiftedMs));
}

function addDays(iso, delta) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return utcIsoFromDate(d);
}

function sundayOfWeek(iso) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return utcIsoFromDate(d);
}

function normalizeKey(str) {
  return String(str || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanSeriesName(series) {
  if (!series) return null;
  return String(series)
    .replace(/\s*\((?:web\s*novel|webnovel|light\s*novel)\)\s*$/i, "")
    .trim();
}

function cleanDeviceLabel(device) {
  if (!device) return null;
  const raw = String(device).trim();
  if (/^moon\+/i.test(raw)) return "moon+";
  return raw.toLowerCase();
}

function conciseSpineTitle(title, series) {
  if (series) return series.replace(/[’‘]/g, "'");
  const cleaned = String(title || "")
    .replace(/[’‘]/g, "'")
    .replace(/\s*\((?:web\s*novel|webnovel|light\s*novel)\)/gi, "")
    .replace(/,?\s*(?:vol(?:ume)?\.?\s*\d+(?:\.\d+)?).*$/i, "")
    .trim();
  if (/^designing data-intensive applications/i.test(cleaned)) return "DDIA";
  if (/^system design interview/i.test(cleaned)) return "System Design";
  if (/^omniscient reader/i.test(cleaned)) return "Omniscient Reader";
  const parts = cleaned.split(/\s*[:–—]\s*/);
  let picked = parts[0].trim();
  // Prefer distinct sequel subtitle (e.g. "Lord of Mysteries 2: Circle of Inevitability" -> "Circle of Inevitability").
  if (parts.length > 1 && /\s\d+$/.test(picked) && parts[1].trim().length >= 4) {
    picked = parts[1].trim();
  }
  if (/^sita$/i.test(picked) && cleaned.length <= 26) {
    picked = cleaned;
  }
  return picked.length <= 28 ? picked : picked.slice(0, 26).trimEnd() + "…";
}

function formatWordsCompact(words) {
  if (!words || words <= 0) return null;
  if (words >= 1_000_000) return `${(words / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M words`;
  return `${(words / 1000).toFixed(1).replace(/\.0$/, "")}k words`;
}

function slugify(input) {
  return normalizeKey(input).replace(/\s+/g, "-") || "item";
}

function pickTone({ category, status, title }) {
  if (status === "reading") return "amber";
  const cat = String(category || "").toLowerCase();
  const t = String(title || "").toLowerCase();
  if (t.includes("mysteries") && !t.includes("inevitability")) return "plum";
  if (t.includes("inevitability")) return "ochre";
  if (t.includes("embers") || t.includes("sea")) return "teal";
  if (cat.includes("light") || cat.includes("novel")) return "slate";
  if (/system|data-intensive|design|code|engineering/.test(t)) return "ink";
  return "rust";
}

function tableExists(db, name) {
  const row = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name);
  return Boolean(row);
}

function resolveSharedBookIds(db, primaryUserId) {
  if (!tableExists(db, "share_links")) return new Set();
  const nowUtc = new Date().toISOString().replace("T", " ").slice(0, 19);
  const links = db
    .prepare(
      `SELECT saved_filter_id, series_name, book_id, owner_id
       FROM share_links
       WHERE expires_at IS NULL OR expires_at > ?`,
    )
    .all(nowUtc);

  if (links.length === 0) return new Set();

  const allowed = new Set();
  const hasSavedFilters = tableExists(db, "saved_filters");
  const hasBookTags = tableExists(db, "book_tags");
  const hasBookLib = tableExists(db, "book_library");

  for (const link of links) {
    if (link.book_id) {
      allowed.add(Number(link.book_id));
      continue;
    }
    if (link.series_name) {
      const rows = db
        .prepare("SELECT id FROM books WHERE status = 'active' AND series = ?")
        .all(link.series_name);
      for (const r of rows) allowed.add(Number(r.id));
      continue;
    }
    if (link.saved_filter_id && hasSavedFilters) {
      const sf = db
        .prepare("SELECT params, owner_id FROM saved_filters WHERE id = ?")
        .get(link.saved_filter_id);
      if (!sf?.params) continue;
      let params;
      try {
        params = JSON.parse(sf.params);
      } catch {
        continue;
      }
      const ownerId = sf.owner_id || link.owner_id || primaryUserId;
      const candidates = db
        .prepare(
          `SELECT b.id, b.title, b.author, b.series, b.word_count,
                  ubs.status AS read_status, ubs.rating
           FROM books b
           LEFT JOIN user_book_status ubs ON ubs.book_id = b.id AND ubs.user_id = ?
           WHERE b.status = 'active'`,
        )
        .all(ownerId);

      for (const b of candidates) {
        if (params.series && b.series !== params.series) continue;
        if (String(params.no_series).toLowerCase() === "true" && b.series !== null) continue;
        if (params.author && b.author !== params.author) continue;
        if (params.reading_status) {
          const rs = b.read_status || "unread";
          if (rs !== params.reading_status) continue;
        }
        if (params.min_rating && !(Number(b.rating) >= Number(params.min_rating))) continue;
        if (params.min_words && !(Number(b.word_count) >= Number(params.min_words))) continue;
        if (params.max_words && !(Number(b.word_count) <= Number(params.max_words))) continue;
        if (params.q) {
          const q = normalizeKey(params.q);
          const hay = normalizeKey(`${b.title} ${b.author} ${b.series || ""}`);
          if (!hay.includes(q)) continue;
        }
        if (params.tag && hasBookTags) {
          const hasTag = db
            .prepare("SELECT 1 FROM book_tags WHERE book_id = ? AND tag = ?")
            .get(b.id, String(params.tag));
          if (!hasTag) continue;
        }
        if (params.library_id && hasBookLib) {
          const inLib = db
            .prepare("SELECT 1 FROM book_library WHERE book_id = ? AND library_id = ?")
            .get(b.id, Number(params.library_id));
          if (!inLib) continue;
        }
        allowed.add(Number(b.id));
      }
    }
  }
  return allowed;
}

export function summarizeTomeDatabase(dbPath, todayIso = toReadingDayIso(new Date())) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const userRow = db.prepare("SELECT id FROM users ORDER BY id ASC LIMIT 1").get();
    const userId = userRow ? Number(userRow.id) : 1;

    const rawBooks = db
      .prepare(
        `SELECT b.id, b.title, b.author, b.series, b.series_index, b.word_count, b.page_count,
                b.status AS book_state,
                COALESCE(bt.label, 'Books') AS category_label,
                ubs.status AS read_status,
                ubs.progress_pct,
                ubs.rating,
                ubs.finished_at,
                ubs.updated_at AS status_updated_at,
                tsp.percentage AS sync_pct,
                tsp.device AS sync_device,
                tsp.updated_at AS sync_updated_at
         FROM books b
         LEFT JOIN book_types bt ON bt.id = b.book_type_id
         LEFT JOIN user_book_status ubs ON ubs.book_id = b.id AND ubs.user_id = ?
         LEFT JOIN tome_sync_positions tsp ON tsp.book_id = b.id AND tsp.user_id = ?
         WHERE b.status IN ('active', 'no_file')
         ORDER BY b.id ASC`,
      )
      .all(userId, userId);

    const seriesRatings = new Map();
    if (tableExists(db, "user_series_rating")) {
      for (const r of db
        .prepare("SELECT series_name, rating FROM user_series_rating WHERE user_id = ? AND rating IS NOT NULL")
        .all(userId)) {
        seriesRatings.set(cleanSeriesName(r.series_name), Number(r.rating));
        seriesRatings.set(String(r.series_name).trim(), Number(r.rating));
      }
    }

    // Deduplicate duplicate Tome book entries (e.g. Moon+ import + library copy with same title + author).
    const canonicalByKey = new Map();
    const bookIdToCanonical = new Map();

    const statusRank = { reading: 4, read: 3, want_to_read: 2, shelved: 1, unread: 0 };

    for (const row of rawBooks) {
      const key = `${normalizeKey(row.title)}||${normalizeKey(row.author)}`;
      const rawPct = row.sync_pct ?? row.progress_pct ?? null;
      const pct100 =
        rawPct !== null && rawPct !== undefined
          ? Math.min(100, Math.max(0, Number(rawPct) <= 1 ? Number(rawPct) * 100 : Number(rawPct)))
          : null;

      let canon = canonicalByKey.get(key);
      if (!canon) {
        canon = {
          canonicalId: Number(row.id),
          rawIds: [Number(row.id)],
          title: String(row.title || "Untitled").trim(),
          author: String(row.author || "Unknown").trim(),
          rawSeries: row.series ? String(row.series).trim() : null,
          series: cleanSeriesName(row.series),
          seriesIndex: row.series_index !== null && row.series_index !== undefined ? Number(row.series_index) : null,
          wordCount: row.word_count ? Number(row.word_count) : null,
          category: String(row.category_label || "Books")
            .toLowerCase()
            .replace(/s$/, ""),
          readStatus: row.read_status || null,
          progressPct: pct100,
          rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : null,
          finishedDate: toReadingDayIso(row.finished_at),
          lastUpdated: toReadingDayIso(row.sync_updated_at || row.status_updated_at),
          lastUpdatedRaw: row.sync_updated_at || row.status_updated_at || null,
          syncDevice: cleanDeviceLabel(row.sync_device),
          seconds: 0,
          liveSeconds: 0,
          sessions: 0,
          pages: 0,
          lastSessionDate: null,
          devices: new Set(),
        };
        if (canon.syncDevice) canon.devices.add(canon.syncDevice);
        canonicalByKey.set(key, canon);
      } else {
        canon.rawIds.push(Number(row.id));
        if (!canon.series && row.series) {
          canon.rawSeries = String(row.series).trim();
          canon.series = cleanSeriesName(row.series);
        }
        if (canon.seriesIndex === null && row.series_index !== null && row.series_index !== undefined) {
          canon.seriesIndex = Number(row.series_index);
        }
        if (row.word_count && (!canon.wordCount || Number(row.word_count) > canon.wordCount)) {
          canon.wordCount = Number(row.word_count);
        }
        if ((statusRank[row.read_status] ?? -1) > (statusRank[canon.readStatus] ?? -1)) {
          canon.readStatus = row.read_status;
        }
        if (pct100 !== null && (canon.progressPct === null || pct100 > canon.progressPct)) {
          canon.progressPct = pct100;
        }
        if (row.rating !== null && row.rating !== undefined && (canon.rating === null || Number(row.rating) > canon.rating)) {
          canon.rating = Number(row.rating);
        }
        const fDate = toReadingDayIso(row.finished_at);
        if (fDate && (!canon.finishedDate || fDate > canon.finishedDate)) {
          canon.finishedDate = fDate;
        }
        const candRaw = row.sync_updated_at || row.status_updated_at || null;
        if (candRaw && (!canon.lastUpdatedRaw || candRaw > canon.lastUpdatedRaw)) {
          canon.lastUpdatedRaw = candRaw;
          canon.lastUpdated = toReadingDayIso(candRaw);
        }
        const dev = cleanDeviceLabel(row.sync_device);
        if (dev) {
          canon.syncDevice = canon.syncDevice || dev;
          canon.devices.add(dev);
        }
      }
      bookIdToCanonical.set(Number(row.id), canon);
    }

    const canonicalBooks = [...canonicalByKey.values()];

    // Infer series membership for Moon+ volumes missing series metadata (e.g. "Lord of Mysteries, Vol. 4")
    // when another volume by the same author already carries a matching series name.
    const knownSeriesByAuthor = new Map();
    for (const b of canonicalBooks) {
      if (!b.series) continue;
      const aKey = normalizeKey(b.author);
      if (!knownSeriesByAuthor.has(aKey)) knownSeriesByAuthor.set(aKey, new Set());
      knownSeriesByAuthor.get(aKey).add(b.series);
    }
    for (const b of canonicalBooks) {
      if (b.series) continue;
      const authorSeries = knownSeriesByAuthor.get(normalizeKey(b.author));
      if (!authorSeries) continue;
      const normTitle = normalizeKey(b.title);
      for (const candidateSeries of authorSeries) {
        const normSeries = normalizeKey(candidateSeries);
        if (normSeries && normTitle.startsWith(normSeries)) {
          b.series = candidateSeries;
          const volMatch = b.title.match(/vol(?:ume)?\.?\s*(\d+(?:\.\d+)?)/i);
          if (volMatch && b.seriesIndex === null) {
            b.seriesIndex = Number(volMatch[1]);
          }
          break;
        }
      }
    }

    // Read all sessions and bucket by 4 AM IST reading day.
    const rawSessions = db
      .prepare(
        `SELECT book_id, started_at, duration_seconds, pages_turned, device
         FROM reading_sessions
         WHERE user_id = ? AND started_at IS NOT NULL
         ORDER BY started_at ASC`,
      )
      .all(userId);

    const dailyAll = new Map();

    for (const s of rawSessions) {
      const dayIso = toReadingDayIso(s.started_at);
      if (!dayIso || dayIso > todayIso) continue;
      const secs = Math.max(0, Number(s.duration_seconds) || 0);
      const pages = Math.max(0, Number(s.pages_turned) || 0);
      if (secs <= 0 && pages <= 0) continue;

      const dev = cleanDeviceLabel(s.device);
      const isMoonAggregate = dev === "moon+";
      const canon = s.book_id ? bookIdToCanonical.get(Number(s.book_id)) : null;

      if (canon) {
        canon.seconds += secs;
        if (!isMoonAggregate) canon.liveSeconds += secs;
        canon.sessions += 1;
        canon.pages += pages;
        if (!canon.lastSessionDate || dayIso > canon.lastSessionDate) {
          canon.lastSessionDate = dayIso;
        }
        if (dev) canon.devices.add(dev);
      }

      let bucket = dailyAll.get(dayIso);
      if (!bucket) {
        bucket = {
          date: dayIso,
          seconds: 0,
          sessions: 0,
          pages: 0,
          titleSeconds: new Map(),
          finishedSet: new Set(),
        };
        dailyAll.set(dayIso, bucket);
      }
      bucket.seconds += secs;
      bucket.sessions += 1;
      bucket.pages += pages;
      if (canon) {
        bucket.titleSeconds.set(canon.title, (bucket.titleSeconds.get(canon.title) || 0) + secs);
      }
    }

    // Reconcile retro-marked imports: if a book was bulk-marked "read" more than 7 days
    // after its final recorded reading session (e.g. Moon+ import day), anchor finishedDate
    // to lastSessionDate so 90-day counts and heatmap finish pips reflect when it was actually finished.
    for (const b of canonicalBooks) {
      if (
        b.readStatus === "read" &&
        b.lastSessionDate &&
        (!b.finishedDate || b.finishedDate > addDays(b.lastSessionDate, 7))
      ) {
        b.finishedDate = b.lastSessionDate;
      }
      if (b.readStatus === "read" && b.finishedDate && b.finishedDate <= todayIso) {
        let bucket = dailyAll.get(b.finishedDate);
        if (!bucket) {
          bucket = {
            date: b.finishedDate,
            seconds: 0,
            sessions: 0,
            pages: 0,
            titleSeconds: new Map(),
            finishedSet: new Set(),
          };
          dailyAll.set(b.finishedDate, bucket);
        }
        bucket.finishedSet.add(b.title);
      }
    }

    // Streaks across all reading days with >= 60s of reading.
    const activeDatesSorted = [...dailyAll.values()]
      .filter((d) => d.seconds >= 60)
      .map((d) => d.date)
      .sort();
    const activeDateSet = new Set(activeDatesSorted);

    let bestDays = 0;
    if (activeDatesSorted.length > 0) {
      let run = 0;
      for (let cursor = activeDatesSorted[0]; cursor <= todayIso; cursor = addDays(cursor, 1)) {
        if (activeDateSet.has(cursor)) {
          run += 1;
          if (run > bestDays) bestDays = run;
        } else {
          run = 0;
        }
      }
    }

    let currentDays = 0;
    let chk = activeDateSet.has(todayIso) ? todayIso : addDays(todayIso, -1);
    while (activeDateSet.has(chk)) {
      currentDays += 1;
      chk = addDays(chk, -1);
    }

    // Window computations (YTD & 90d).
    const yearStart = `${todayIso.slice(0, 4)}-01-01`;
    const d90Start = addDays(todayIso, -89);
    const w52Start = addDays(sundayOfWeek(todayIso), -51 * 7);
    const earliestDate = activeDatesSorted[0] || null;

    function computeWindow(fromIso, toIso) {
      let seconds = 0;
      let activeDays = 0;
      let sessions = 0;
      let pagesTurned = 0;

      for (const d of dailyAll.values()) {
        if (d.date < fromIso || d.date > toIso) continue;
        seconds += d.seconds;
        sessions += d.sessions;
        pagesTurned += d.pages;
        if (d.seconds >= 60) activeDays += 1;
      }

      const booksFinished = canonicalBooks.filter(
        (b) => b.readStatus === "read" && b.finishedDate && b.finishedDate >= fromIso && b.finishedDate <= toIso,
      ).length;

      const effectiveFrom = earliestDate && earliestDate > fromIso ? earliestDate : fromIso;
      const spanDays = Math.max(
        7,
        Math.round((Date.parse(`${toIso}T12:00:00Z`) - Date.parse(`${effectiveFrom}T12:00:00Z`)) / 86_400_000) + 1,
      );
      const hours = Number((seconds / 3600).toFixed(1));
      const avgHoursPerWeek = Number((hours / (spanDays / 7)).toFixed(1));

      return {
        hours,
        avgHoursPerWeek,
        activeDays,
        sessions,
        booksFinished,
        pagesTurned,
      };
    }

    // Estimate real words/hour pace from finished books with wordCount + liveSeconds, fallback 13,500 wph (~225 wpm).
    let paceWordsSum = 0;
    let paceHoursSum = 0;
    for (const b of canonicalBooks) {
      if (b.readStatus === "read" && b.wordCount && b.seconds >= 1800) {
        paceWordsSum += b.wordCount;
        paceHoursSum += b.seconds / 3600;
      }
    }
    const rawWph = paceHoursSum > 0 ? paceWordsSum / paceHoursSum : 13_500;
    const wordsPerHour = Math.min(22_000, Math.max(9_000, rawWph));

    // Currently reading cards (active nightstand).
    const currentlyReading = canonicalBooks
      .filter((b) => b.readStatus === "reading")
      .sort((a, b) => String(b.lastUpdatedRaw || "").localeCompare(String(a.lastUpdatedRaw || "")))
      .map((b) => {
        const progressPct = Number((b.progressPct ?? 0).toFixed(1));
        const wordsLeft =
          b.wordCount !== null ? Math.max(0, Math.round(b.wordCount * (1 - progressPct / 100))) : null;
        const estHoursLeft =
          wordsLeft !== null ? Number(Math.max(0.1, wordsLeft / wordsPerHour).toFixed(1)) : null;
        const primaryDevice =
          b.syncDevice ||
          [...b.devices].find((d) => d !== "moon+") ||
          [...b.devices][0] ||
          null;
        return {
          title: b.title,
          author: b.author,
          series: b.series,
          seriesIndex: b.seriesIndex,
          category: b.category,
          progressPct,
          wordCount: b.wordCount,
          wordsLeft,
          estHoursLeft,
          device: primaryDevice,
          lastReadDate: b.lastSessionDate || b.lastUpdated,
        };
      });

    // Build Stacks (Spine Rack + Table Ledger):
    //   - Keep currently-reading books as individual entries so active progress stands out.
    //   - Collapse multi-volume non-reading series (>= 2 volumes) into a single series entry.
    //   - Include unmarked books (logged via Moon+ or in library) per user preference.
    const nonReadingBySeries = new Map();
    const standaloneEntries = [];

    for (const b of canonicalBooks) {
      if (b.readStatus === "reading") {
        standaloneEntries.push(b);
        continue;
      }
      if (b.series) {
        if (!nonReadingBySeries.has(b.series)) nonReadingBySeries.set(b.series, []);
        nonReadingBySeries.get(b.series).push(b);
      } else {
        standaloneEntries.push(b);
      }
    }

    const stacks = [];

    for (const [seriesName, vols] of nonReadingBySeries.entries()) {
      if (vols.length === 1) {
        standaloneEntries.push(vols[0]);
        continue;
      }
      const totalSecs = vols.reduce((s, v) => s + v.seconds, 0);
      const hours = Number((totalSecs / 3600).toFixed(1));
      const knownWords = vols.reduce((s, v) => s + (v.wordCount || 0), 0);
      const anyRead = vols.some((v) => v.readStatus === "read");
      const status = anyRead ? "finished" : totalSecs > 0 ? "logged" : "unread";
      const sRating =
        seriesRatings.get(seriesName) ??
        (vols.some((v) => v.rating !== null)
          ? Number(
              (
                vols.filter((v) => v.rating !== null).reduce((s, v) => s + v.rating, 0) /
                vols.filter((v) => v.rating !== null).length
              ).toFixed(1),
            )
          : null);
      const latestDate =
        vols
          .map((v) => v.lastSessionDate || v.finishedDate || v.lastUpdated)
          .filter(Boolean)
          .sort()
          .at(-1) || null;

      stacks.push({
        id: slugify(seriesName),
        shortTitle: conciseSpineTitle(seriesName, seriesName),
        title: `${seriesName} (${vols.length} vols)`,
        author: vols[0].author,
        category: vols[0].category,
        series: seriesName,
        volumeCount: vols.length,
        scaleLabel: `${vols.length} vols`,
        wordCount: knownWords > 0 ? knownWords : null,
        hours,
        status,
        active: false,
        progressPct: null,
        rating: sRating,
        lastDate: latestDate,
        tone: pickTone({ category: vols[0].category, status, title: seriesName }),
      });
    }

    for (const b of standaloneEntries) {
      const hours = Number((b.seconds / 3600).toFixed(1));
      const status =
        b.readStatus === "reading"
          ? "reading"
          : b.readStatus === "read"
            ? "finished"
            : b.seconds > 0
              ? "logged"
              : "unread";
      const progressPct = b.readStatus === "reading" ? Number((b.progressPct ?? 0).toFixed(1)) : null;
      const wordsLabel = formatWordsCompact(b.wordCount);
      const scaleLabel =
        progressPct !== null && wordsLabel
          ? `${wordsLabel} · ${progressPct}%`
          : wordsLabel || (b.series && b.seriesIndex ? `#${b.seriesIndex}` : b.category);
      const rating = b.rating ?? (b.series ? seriesRatings.get(b.series) ?? null : null);

      const cleanDisplayTitle = b.title
        .replace(/\s*\((?:web\s*novel|webnovel|light\s*novel)\)/gi, "")
        .split(/\s*:\s*The Big Ideas/i)[0]
        .trim();

      stacks.push({
        id: slugify(`${b.title}-${b.author}`),
        shortTitle: conciseSpineTitle(b.title, null),
        title: cleanDisplayTitle,
        author: b.author,
        category: b.series && b.seriesIndex ? `${b.category} · ${b.series.toLowerCase()} #${b.seriesIndex}` : b.category,
        series: b.series,
        volumeCount: 1,
        scaleLabel,
        wordCount: b.wordCount,
        hours,
        status,
        active: b.readStatus === "reading",
        progressPct,
        rating,
        lastDate: b.lastSessionDate || b.finishedDate || b.lastUpdated,
        tone: pickTone({ category: b.category, status, title: b.title }),
      });
    }

    // Sort stacks: major completed/logged runs (>= 2h) descending, then active reads, then remaining items by hours & wordCount.
    stacks.sort((a, b) => {
      const aMajor = a.hours >= 2 && !a.active ? 1 : 0;
      const bMajor = b.hours >= 2 && !b.active ? 1 : 0;
      if (aMajor !== bMajor) return bMajor - aMajor;
      if (aMajor && bMajor && b.hours !== a.hours) return b.hours - a.hours;
      if (a.active !== b.active) return a.active ? -1 : 1;
      if (b.hours !== a.hours) return b.hours - a.hours;
      if ((b.wordCount || 0) !== (a.wordCount || 0)) return (b.wordCount || 0) - (a.wordCount || 0);
      return String(b.lastDate || "").localeCompare(String(a.lastDate || ""));
    });

    // Opt-in Marginalia (highlights strictly from non-expired Tome share_links).
    const marginalia = [];
    if (tableExists(db, "annotations")) {
      const sharedBookIds = resolveSharedBookIds(db, userId);
      if (sharedBookIds.size > 0) {
        const placeholders = [...sharedBookIds].map(() => "?").join(",");
        const annRows = db
          .prepare(
            `SELECT a.book_id, a.chapter, a.highlighted_text, a.note, a.created_at
             FROM annotations a
             WHERE a.user_id = ?
               AND a.book_id IN (${placeholders})
               AND a.highlighted_text IS NOT NULL
               AND trim(a.highlighted_text) != ''
             ORDER BY COALESCE(a.updated_at, a.created_at) DESC
             LIMIT 6`,
          )
          .all(userId, ...sharedBookIds);

        for (const a of annRows) {
          const canon = bookIdToCanonical.get(Number(a.book_id));
          if (!canon) continue;
          marginalia.push({
            text: String(a.highlighted_text).trim(),
            note: a.note ? String(a.note).trim() : null,
            bookTitle: canon.title,
            author: canon.author,
            chapter: a.chapter ? String(a.chapter).trim() : null,
            date: toReadingDayIso(a.created_at),
          });
        }
      }
    }

    // 52-week rolling daily cells.
    const days = [...dailyAll.values()]
      .filter((d) => d.date >= w52Start && (d.seconds >= 60 || d.finishedSet.size > 0))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => {
        const sortedTitles = [...d.titleSeconds.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([t]) => t);
        return {
          date: d.date,
          minutes: d.seconds > 0 ? Math.max(1, Math.round(d.seconds / 60)) : 0,
          sessions: d.sessions,
          pages: d.pages,
          titles: sortedTitles,
          finishedTitles: [...d.finishedSet],
        };
      });

    const activeDays52w = days.filter((d) => d.minutes > 0).length;
    const totalWordsIndexed = canonicalBooks.reduce((sum, b) => sum + (b.wordCount || 0), 0);

    // Content-only fingerprint (excludes syncedAt and rolling cutoffs so quiet days never trigger deploys).
    const hash = crypto.createHash("sha256");
    for (const d of [...dailyAll.values()].sort((a, b) => a.date.localeCompare(b.date))) {
      hash.update(
        `day:${d.date}|${Math.round(d.seconds / 60)}|${d.sessions}|${d.pages}|${[...d.finishedSet].sort().join(",")}\n`,
      );
    }
    for (const r of currentlyReading) {
      hash.update(`cur:${r.title}|${r.progressPct}|${r.device ?? ""}\n`);
    }
    for (const s of stacks) {
      hash.update(`stk:${s.id}|${s.status}|${s.hours}|${s.rating ?? ""}|${s.volumeCount}\n`);
    }
    for (const m of marginalia) {
      hash.update(`mar:${m.bookTitle}|${m.text}\n`);
    }
    const fingerprint = `sha256:${hash.digest("hex").slice(0, 16)}`;

    return {
      syncedAt: todayIso,
      sourceHost: process.env.TOME_SOURCE_HOST || process.env.OPENGYM_SOURCE_HOST || "arcadia",
      fingerprint,
      timezone: TZ_NAME,
      rolloverHour: ROLLOVER_HOURS,
      libraryCount: canonicalBooks.length,
      totalWordsIndexed,
      streak: {
        currentDays,
        bestDays: Math.max(bestDays, currentDays),
      },
      activeDays52w,
      windows: {
        ytd: computeWindow(yearStart, todayIso),
        d90: computeWindow(d90Start, todayIso),
      },
      currentlyReading,
      stacks,
      marginalia,
      days,
    };
  } finally {
    db.close();
  }
}

function githubHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "tapanmeena-tome-sync",
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
  const content =
    file.truncated && file.raw_url
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
    throw new Error("TOME_GIST_TOKEN or OPENGYM_GIST_TOKEN is required for --init-gist.");
  }
  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: "Sanitized Tome reading telemetry for tapanmeena.com (/life)",
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
  console.log(`TOME_GIST_ID=${created.id}`);
}

async function pushToGistAndDeploy(summary, { force, out, outExplicit }) {
  const gistId = (process.env.TOME_GIST_ID || process.env.OPENGYM_GIST_ID || "").trim();
  const token = (process.env.TOME_GIST_TOKEN || process.env.OPENGYM_GIST_TOKEN || "").trim();
  const filename = (process.env.TOME_GIST_FILENAME || "tome.json").trim();
  const deployHook = (process.env.VERCEL_DEPLOY_HOOK_URL || "").trim();

  if (!gistId || !token) {
    throw new Error(
      "TOME_GIST_ID/OPENGYM_GIST_ID and TOME_GIST_TOKEN/OPENGYM_GIST_TOKEN must be set when using --push.",
    );
  }

  if (!force) {
    const lastHash = (await fs.readFile(defaultHashFile, "utf8").catch(() => "")).trim();
    if (lastHash && lastHash === summary.fingerprint) {
      console.log(`[tome] Unchanged (${summary.fingerprint}) — skipping Gist push & deploy.`);
      return;
    }

    if (!lastHash) {
      const remoteFp = await fetchRemoteFingerprint(gistId, token, filename).catch(() => null);
      if (remoteFp && remoteFp === summary.fingerprint) {
        await fs.writeFile(defaultHashFile, summary.fingerprint + "\n", "utf8").catch(() => {});
        console.log(`[tome] Matches remote Gist (${summary.fingerprint}) — cached hash, skipping deploy.`);
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
  console.log(`[tome] Updated Gist ${gistId.slice(0, 6)}… (${filename}) -> ${summary.fingerprint}`);

  if (deployHook) {
    const hookRes = await fetch(deployHook, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
    });
    if (!hookRes.ok) {
      const errText = await hookRes.text().catch(() => "");
      throw new Error(`Vercel Deploy Hook failed (${hookRes.status}): ${errText.slice(0, 200)}`);
    }
    console.log("[tome] Triggered Vercel Deploy Hook.");
  }

  await fs.writeFile(defaultHashFile, summary.fingerprint + "\n", "utf8");
}

async function main() {
  const { src, out, outExplicit, push, initGist, force } = parseArgs(process.argv.slice(2));
  const dbPath = resolveDbPath(src);
  const summary = summarizeTomeDatabase(dbPath);

  if (initGist) {
    const token = (process.env.TOME_GIST_TOKEN || process.env.OPENGYM_GIST_TOKEN || "").trim();
    const filename = (process.env.TOME_GIST_FILENAME || "tome.json").trim();
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
    `Synced ${summary.windows.ytd.hours}h YTD reading (${summary.activeDays52w} active days in 52w, ${summary.stacks.length} stack items) -> ${path.relative(repoRoot, out)}`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
