import rawOpenGym from "./opengym.json";
import rawTome from "./tome.json";

export interface OpenGymWindowStats {
  sessions: number;
  avgPerWeek: number;
  sets: number;
  tonnage: number;
  avgTonnage: number;
}

export interface OpenGymDay {
  date: string;
  routine: string;
  sets: number;
  durationMin: number | null;
  prs: number;
}

export interface OpenGymSnapshot {
  syncedAt: string;
  sourceHost: string;
  fingerprint?: string;
  unit: "kg" | "lb";
  streak: {
    currentWeeks: number;
    bestWeeks: number;
    minPerWeek: number;
  };
  activeDays52w: number;
  windows: {
    ytd: OpenGymWindowStats;
    d90: OpenGymWindowStats;
  };
  days: OpenGymDay[];
}

export interface TomeWindowStats {
  hours: number;
  avgHoursPerWeek: number;
  activeDays: number;
  sessions: number;
  booksFinished: number;
  pagesTurned: number;
}

export interface TomeDay {
  date: string;
  minutes: number;
  sessions: number;
  pages: number;
  titles: string[];
  finishedTitles: string[];
}

export interface TomeActiveBook {
  title: string;
  author: string;
  series: string | null;
  seriesIndex: number | null;
  category: string;
  progressPct: number;
  wordCount: number | null;
  wordsLeft: number | null;
  estHoursLeft: number | null;
  device: string | null;
  lastReadDate: string | null;
}

export type SpineTone = "plum" | "ochre" | "teal" | "rust" | "amber" | "slate" | "ink";

export interface TomeStackItem {
  id: string;
  shortTitle: string;
  title: string;
  author: string;
  category: string;
  series: string | null;
  volumeCount: number;
  scaleLabel: string;
  wordCount: number | null;
  hours: number;
  status: "reading" | "finished" | "logged" | "unread";
  active: boolean;
  progressPct: number | null;
  rating: number | null;
  lastDate: string | null;
  tone: SpineTone;
}

export interface TomeMarginaliaItem {
  text: string;
  note: string | null;
  bookTitle: string;
  author: string;
  chapter: string | null;
  date: string | null;
}

export interface TomeSnapshot {
  syncedAt: string;
  sourceHost: string;
  fingerprint?: string;
  timezone: string;
  rolloverHour: number;
  libraryCount: number;
  totalWordsIndexed: number;
  streak: {
    currentDays: number;
    bestDays: number;
  };
  activeDays52w: number;
  windows: {
    ytd: TomeWindowStats;
    d90: TomeWindowStats;
  };
  currentlyReading: TomeActiveBook[];
  stacks: TomeStackItem[];
  marginalia: TomeMarginaliaItem[];
  days: TomeDay[];
}

export interface UnifiedHeatmapCell {
  date: string;
  labelDate: string;
  isFuture: boolean;
  trained: boolean;
  gymLevel: 0 | 1 | 2 | 3;
  routine: string | null;
  sets: number;
  durationMin: number | null;
  prs: number;
  read: boolean;
  readLevel: 0 | 1 | 2 | 3;
  readMinutes: number;
  readPages: number;
  readTitles: string[];
  finishedTitles: string[];
}

export interface ShelfItem {
  title: string;
  meta: string;
  status: string;
  active?: boolean;
}

export const openGymStats = rawOpenGym as OpenGymSnapshot;
export const tomeStats = rawTome as TomeSnapshot;

export const latestLifeSyncIso =
  openGymStats.syncedAt >= tomeStats.syncedAt ? openGymStats.syncedAt : tomeStats.syncedAt;

const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toLocalIso(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function formatCalendarDay(iso: string, includeYear = true): string {
  const d = new Date(iso + "T12:00:00");
  const base = `${DAYS_SHORT[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
  return includeYear ? `${base}, ${d.getFullYear()}` : base;
}

export function formatShortMonthDay(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${MONTHS_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDurationMinutes(mins: number): string {
  if (!mins || mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const rem = Math.round(mins % 60);
  if (h <= 0) return `${rem}m`;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function formatWordCountCompact(words: number | null): string | null {
  if (!words || words <= 0) return null;
  if (words >= 1_000_000) {
    return `${(words / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  return `${(words / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}

export function formatHalfStars(rating: number | null): string {
  if (rating === null || rating === undefined || rating <= 0) return "—";
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? "½" : "";
  return "★".repeat(full) + half;
}

export function levelForSets(sets: number): 0 | 1 | 2 | 3 {
  if (sets <= 0) return 0;
  if (sets >= 29) return 3;
  if (sets >= 16) return 2;
  return 1;
}

export function levelForReadingMinutes(minutes: number): 0 | 1 | 2 | 3 {
  if (minutes <= 0) return 0;
  if (minutes >= 90) return 3;
  if (minutes >= 30) return 2;
  return 1;
}

export function computeSpineDimensions(item: TomeStackItem): { widthPx: number; heightPct: number } {
  // Estimate scale from wordCount when present, else reading hours (~13.5k words/hr), else volume count.
  const effectiveWords =
    item.wordCount && item.wordCount > 0
      ? item.wordCount
      : item.hours > 0
        ? item.hours * 13_500
        : item.volumeCount * 95_000;

  const logScale = Math.log10(Math.max(35_000, effectiveWords)); // ~4.54 (35k) -> ~6.40 (2.5M)
  const normalized = Math.min(1, Math.max(0, (logScale - 4.54) / (6.38 - 4.54)));
  const volBonus = item.volumeCount > 1 ? Math.min(14, (item.volumeCount - 1) * 2.5) : 0;
  const widthPx = Math.round(Math.min(92, Math.max(34, 34 + normalized * 46 + volBonus)));

  // Subtle organic height variation across formats/series.
  let heightPct = 86;
  if (item.volumeCount > 1) heightPct = 96;
  else if (item.tone === "ink") heightPct = 95;
  else if (item.category.includes("light novel")) heightPct = 92;
  else if (item.active) heightPct = 87;

  return { widthPx, heightPct };
}

export function buildUnifiedHeatmap52w(gymSnapshot: OpenGymSnapshot, tomeSnapshot: TomeSnapshot) {
  const anchorIso =
    gymSnapshot.syncedAt >= tomeSnapshot.syncedAt ? gymSnapshot.syncedAt : tomeSnapshot.syncedAt;
  const end = new Date(anchorIso + "T12:00:00");
  // End of the Sunday–Saturday week containing anchorIso, then step back 52 weeks.
  const endSaturday = new Date(end);
  endSaturday.setDate(end.getDate() + (6 - end.getDay()));

  const startSunday = new Date(endSaturday);
  startSunday.setDate(endSaturday.getDate() - (52 * 7 - 1));

  const gymByDate = new Map(gymSnapshot.days.map((d) => [d.date, d]));
  const tomeByDate = new Map(tomeSnapshot.days.map((d) => [d.date, d]));

  const months: string[] = [];
  const cells: UnifiedHeatmapCell[] = [];

  let lastMonth = -1;
  let lastLabelWeek = -10;

  for (let w = 0; w < 52; w++) {
    const weekStart = new Date(startSunday);
    weekStart.setDate(startSunday.getDate() + w * 7);
    const m = weekStart.getMonth();

    if (m !== lastMonth) {
      lastMonth = m;
      if (w - lastLabelWeek >= 3 && w < 51) {
        months.push(MONTHS_SHORT[m]);
        lastLabelWeek = w;
      } else if (w === 1 && lastLabelWeek === 0) {
        // Avoid colliding labels (e.g. NOVDEC) when week 0 only holds the final day of the prior month.
        months[0] = "";
        months.push(MONTHS_SHORT[m]);
        lastLabelWeek = w;
      } else {
        months.push("");
      }
    } else {
      months.push("");
    }

    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startSunday);
      cellDate.setDate(startSunday.getDate() + w * 7 + d);
      const iso = toLocalIso(cellDate);
      const isFuture = iso > anchorIso;
      const gEntry = !isFuture ? gymByDate.get(iso) : undefined;
      const tEntry = !isFuture ? tomeByDate.get(iso) : undefined;

      const sets = gEntry?.sets ?? 0;
      const readMinutes = tEntry?.minutes ?? 0;

      cells.push({
        date: iso,
        labelDate: formatCalendarDay(iso, true),
        isFuture,
        trained: Boolean(gEntry),
        gymLevel: gEntry ? levelForSets(sets) : 0,
        routine: gEntry?.routine ?? null,
        sets,
        durationMin: gEntry?.durationMin ?? null,
        prs: gEntry?.prs ?? 0,
        read: readMinutes > 0,
        readLevel: levelForReadingMinutes(readMinutes),
        readMinutes,
        readPages: tEntry?.pages ?? 0,
        readTitles: tEntry?.titles ?? [],
        finishedTitles: tEntry?.finishedTitles ?? [],
      });
    }
  }

  const yearPrefix = anchorIso.slice(0, 4);
  const d90CutoffDate = new Date(end);
  d90CutoffDate.setDate(end.getDate() - 89);
  const d90CutoffIso = toLocalIso(d90CutoffDate);

  const pastCells = cells.filter((c) => !c.isFuture);
  const combinedActiveDays52w = pastCells.filter((c) => c.trained || c.read).length;
  const dualDays52w = pastCells.filter((c) => c.trained && c.read).length;

  const ytdCells = pastCells.filter((c) => c.date >= `${yearPrefix}-01-01`);
  const ytdCombinedDays = ytdCells.filter((c) => c.trained || c.read).length;
  const ytdDualDays = ytdCells.filter((c) => c.trained && c.read).length;
  const ytdElapsedDays = Math.max(1, ytdCells.length);

  const d90Cells = pastCells.filter((c) => c.date >= d90CutoffIso);
  const d90CombinedDays = d90Cells.filter((c) => c.trained || c.read).length;
  const d90DualDays = d90Cells.filter((c) => c.trained && c.read).length;

  const latestActive = [...pastCells].reverse().find((c) => c.trained || c.read) ?? null;
  const latestDual = [...pastCells].reverse().find((c) => c.trained && c.read) ?? null;
  const latestBookFinish = [...pastCells].reverse().find((c) => c.finishedTitles.length > 0) ?? null;
  const latestPrDay = [...pastCells].reverse().find((c) => c.prs > 0) ?? null;

  return {
    anchorIso,
    months,
    cells,
    combinedActiveDays52w,
    dualDays52w,
    ytdCombinedDays,
    ytdDualDays,
    ytdElapsedDays,
    d90CombinedDays,
    d90DualDays,
    latestActive,
    latestDual,
    latestBookFinish,
    latestPrDay,
  };
}

export function buildRecentMiniDots(
  snapshot: OpenGymSnapshot,
  count = 14,
  anchorIso = latestLifeSyncIso,
) {
  const byDate = new Map(snapshot.days.map((d) => [d.date, d]));
  const end = new Date(anchorIso + "T12:00:00");
  const dots: { date: string; level: 0 | 1 | 2 | 3; prs: number }[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const iso = toLocalIso(d);
    const entry = byDate.get(iso);
    dots.push({
      date: iso,
      level: entry ? levelForSets(entry.sets) : 0,
      prs: entry?.prs ?? 0,
    });
  }
  return dots;
}

export function buildRecentReadingMiniDots(
  snapshot: TomeSnapshot,
  count = 14,
  anchorIso = latestLifeSyncIso,
) {
  const byDate = new Map(snapshot.days.map((d) => [d.date, d]));
  const end = new Date(anchorIso + "T12:00:00");
  const dots: { date: string; level: 0 | 1 | 2 | 3; finished: boolean }[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const iso = toLocalIso(d);
    const entry = byDate.get(iso);
    dots.push({
      date: iso,
      level: entry ? levelForReadingMinutes(entry.minutes) : 0,
      finished: Boolean(entry && entry.finishedTitles.length > 0),
    });
  }
  return dots;
}

export const readingShelf: ShelfItem[] = [
  ...tomeStats.currentlyReading.map((b) => ({
    title: b.title,
    meta: `${b.author.toLowerCase()}${b.device ? ` · ${b.device}` : ""}`,
    status: `${b.progressPct}%`,
    active: true,
  })),
  ...tomeStats.stacks
    .filter((s) => !s.active && s.status === "finished")
    .slice(0, 3)
    .map((s) => ({
      title: s.title,
      meta: s.author.toLowerCase(),
      status: s.rating ? formatHalfStars(s.rating) : "finished",
    })),
];

export const playingShelf: ShelfItem[] = [
  {
    title: "Red Dead Redemption 2",
    meta: "ps5 · via beat-the-backlog",
    status: "in rotation",
    active: true,
  },
  {
    title: "Balatro",
    meta: "flight-mode time sink",
    status: "shelved",
  },
  {
    title: "Hollow Knight: Silksong",
    meta: "team cherry",
    status: "cleared",
  },
];
