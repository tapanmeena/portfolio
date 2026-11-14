import rawSnapshot from "./opengym.json";

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

export interface HeatmapCell {
  date: string;
  labelDate: string;
  trained: boolean;
  isFuture: boolean;
  level: 0 | 1 | 2 | 3;
  routine: string | null;
  sets: number;
  durationMin: number | null;
  prs: number;
}

export interface ShelfItem {
  title: string;
  meta: string;
  status: string;
  active?: boolean;
}

export const openGymStats = rawSnapshot as OpenGymSnapshot;

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

export function levelForSets(sets: number): 0 | 1 | 2 | 3 {
  if (sets <= 0) return 0;
  if (sets >= 29) return 3;
  if (sets >= 16) return 2;
  return 1;
}

export function buildHeatmap52w(snapshot: OpenGymSnapshot) {
  const end = new Date(snapshot.syncedAt + "T12:00:00");
  // End of the current Sunday–Saturday week containing syncedAt, then step back 52 weeks.
  const endSaturday = new Date(end);
  endSaturday.setDate(end.getDate() + (6 - end.getDay()));

  const startSunday = new Date(endSaturday);
  startSunday.setDate(endSaturday.getDate() - (52 * 7 - 1));

  const byDate = new Map(snapshot.days.map((d) => [d.date, d]));
  const months: string[] = [];
  const cells: HeatmapCell[] = [];

  let lastMonth = -1;
  for (let w = 0; w < 52; w++) {
    const weekStart = new Date(startSunday);
    weekStart.setDate(startSunday.getDate() + w * 7);
    if (weekStart.getMonth() !== lastMonth && w < 51) {
      months.push(MONTHS_SHORT[weekStart.getMonth()]);
      lastMonth = weekStart.getMonth();
    } else {
      months.push("");
    }

    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startSunday);
      cellDate.setDate(startSunday.getDate() + w * 7 + d);
      const iso = toLocalIso(cellDate);
      const isFuture = iso > snapshot.syncedAt;
      const entry = !isFuture ? byDate.get(iso) : undefined;
      const sets = entry?.sets ?? 0;

      cells.push({
        date: iso,
        labelDate: formatCalendarDay(iso, true),
        trained: Boolean(entry),
        isFuture,
        level: entry ? levelForSets(sets) : 0,
        routine: entry?.routine ?? null,
        sets,
        durationMin: entry?.durationMin ?? null,
        prs: entry?.prs ?? 0,
      });
    }
  }

  const latestTrained = [...cells].reverse().find((c) => c.trained) ?? null;
  return { months, cells, latestTrained };
}

export function buildRecentMiniDots(snapshot: OpenGymSnapshot, count = 14) {
  const byDate = new Map(snapshot.days.map((d) => [d.date, d]));
  const end = new Date(snapshot.syncedAt + "T12:00:00");
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

export const readingShelf: ShelfItem[] = [
  {
    title: "Designing Data-Intensive Applications",
    meta: "martin kleppmann",
    status: "reading",
    active: true,
  },
  {
    title: "Lord of the Mysteries",
    meta: "cuttlefish that loves diving",
    status: "finished",
  },
  {
    title: "Project Hail Mary",
    meta: "andy weir",
    status: "finished",
  },
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
