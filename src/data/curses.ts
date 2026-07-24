export type Severity = 1 | 2 | 3;

export interface Curse {
  date: string; // YYYY-MM
  project: string;
  projectSlug?: string;
  tags: string[];
  severity: Severity;
  title: string;
  body: string;
}

// Newest to oldest. Severity: 1 = mildly cursed, 2 = deeply cursed, 3 = eldritch.
export const curses: Curse[] = [
  {
    date: "2026-07",
    project: "GitHub Actions",
    tags: ["CI/CD", "Scheduling"],
    severity: 2,
    title: "GitHub Actions cron is a suggestion, not an appointment",
    body: "A scheduled workflow is not guaranteed to run at the specified time. Jobs can be delayed—or even dropped—during periods of high load, especially at the start of the hour. Pick an odd minute, make the job idempotent, and use an external scheduler when timing is a requirement rather than a preference.",
  },
  {
    date: "2026-04",
    project: "StalkMarket",
    projectSlug: "stalkmarket",
    tags: ["Auth", "Brokers"],
    severity: 3,
    title: "Indian broker auth is four different religions in a trenchcoat",
    body: "Angel One = TOTP. Upstox + Zerodha = OAuth. Groww = API keys. There is no unified standard, and there will not be one. Hide the chaos behind a provider interface and refresh tokens proactively — never wait for the 401.",
  },
  {
    date: "2025-10",
    project: "Finalyze",
    projectSlug: "finalyze",
    tags: ["SQLite", "Performance"],
    severity: 3,
    title: "Batch inserts without a transaction = one fsync per row",
    body: "A 200-row import takes 8 seconds. Wrap it in `BEGIN`/`COMMIT` and the same import takes 40ms. The cost of forgetting is 200×.",
  },
  {
    date: "2025-08",
    project: "ScreenSage",
    projectSlug: "screensage-macos",
    tags: ["macOS", "OCR"],
    severity: 1,
    title: "Apple Vision OCR has zero reason to lose to Tesseract on macOS",
    body: "Free, local, fast, shockingly accurate, no model download. There is no scenario in 2025 where shipping Tesseract on macOS is the right call.",
  },
];

const curseYears = curses.map((curse) =>
  Number.parseInt(curse.date.slice(0, 4), 10),
);

export const curseStats = {
  total: curses.length,
  earliestYear: Math.min(...curseYears),
  latestYear: Math.max(...curseYears),
};
