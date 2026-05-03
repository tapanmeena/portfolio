import type { CollectionEntry } from "astro:content";

export type Tier = "beginner" | "intermediate" | "advanced";

export const TIERS: Tier[] = ["beginner", "intermediate", "advanced"];

export interface TierMeta {
  tier: Tier;
  label: string;
  signal: string; // traffic-light glyph
  abbr: string;
  blurb: string;
  prereq?: string;
  outcome: string;
  pace: string;
  color: string;
}

export const TIER_META: Record<Tier, TierMeta> = {
  beginner: {
    tier: "beginner",
    label: "beginner",
    signal: "●",
    abbr: "01",
    blurb:
      "From 'I want to invest' to 'I trade with a plan.' Markets, jargon, charts, risk, and the boring discipline that keeps you alive.",
    outcome:
      "Survive your first year. Understand markets, jargon, charts, risk, and basic strategies.",
    pace: "2–4 weeks · paper trade for 3 months before live",
    color: "#10b981",
  },
  intermediate: {
    tier: "intermediate",
    label: "intermediate",
    signal: "●",
    abbr: "02",
    blurb:
      "Six months of paper or live trading under your belt. Time to add derivatives, multi-timeframe systems, screening, and proper backtesting.",
    prereq:
      "Comfortable with candles, indicators, position sizing, and the 1% rule.",
    outcome:
      "Filter setups, think in portfolios, measure in R-multiples, use derivatives without blowing up.",
    pace: "1–2 months",
    color: "#f59e0b",
  },
  advanced: {
    tier: "advanced",
    label: "advanced",
    signal: "●",
    abbr: "03",
    blurb:
      "A year-plus of disciplined trading and comfort with code. Quant methods, vol trading, portfolio construction, algos, ML, and the operational discipline of running a book.",
    prereq:
      "Comfort with intermediate material. Python or another scripting language.",
    outcome:
      "Think in distributions and portfolios of strategies. Build infrastructure that runs without you.",
    pace: "Ongoing reference + research",
    color: "#ef4444",
  },
};

export function getPublishedTrading(entries: CollectionEntry<"trading">[]) {
  return entries.slice().sort((a, b) => {
    if (a.data.tier !== b.data.tier) {
      return (
        TIERS.indexOf(a.data.tier as Tier) - TIERS.indexOf(b.data.tier as Tier)
      );
    }
    return a.data.order - b.data.order;
  });
}

export function getTier(entries: CollectionEntry<"trading">[], tier: Tier) {
  return entries
    .filter((e) => e.data.tier === tier)
    .sort((a, b) => a.data.order - b.data.order);
}

export function getSpecial(
  entries: CollectionEntry<"trading">[],
  slug: string,
) {
  return entries.find((e) => e.id === `special/${slug}`) ?? null;
}

export function nextTier(tier: Tier): Tier | null {
  const i = TIERS.indexOf(tier);
  return i >= 0 && i < TIERS.length - 1 ? TIERS[i + 1] : null;
}

export function prevTier(tier: Tier): Tier | null {
  const i = TIERS.indexOf(tier);
  return i > 0 ? TIERS[i - 1] : null;
}

// "beginner/01-market-basics" -> { tier, slug }
export function parseId(id: string): { tier: Tier; slug: string } | null {
  const [tier, ...rest] = id.split("/");
  if (!TIERS.includes(tier as Tier)) return null;
  return { tier: tier as Tier, slug: rest.join("/") };
}

export function chapterUrl(entry: CollectionEntry<"trading">) {
  return `/trading/${entry.id}`;
}

export function tierUrl(tier: Tier) {
  return `/trading/${tier}`;
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}
