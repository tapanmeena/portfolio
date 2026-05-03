// Syncs trading curriculum from ../TradingBot/docs into src/content/trading.
// Idempotent: re-running overwrites the destination files.
//
// Usage: node scripts/sync-trading.mjs [pathToTradingBot]
//
// Frontmatter is injected from each chapter's first H1 plus its order prefix.
// READMEs are intentionally skipped (tier index pages live in src/pages).

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultSrc = path.resolve(repoRoot, "..", "TradingBot", "docs");
const sourceRoot = process.argv[2] ? path.resolve(process.argv[2]) : defaultSrc;
const destRoot = path.join(repoRoot, "src", "content", "trading");
const publicAssetsRoot = path.join(repoRoot, "public", "trading-assets");

// learn folder maps to "beginner" tier on the website.
const TIER_MAP = {
  learn: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

const TIER_DESCRIPTION = {
  beginner:
    "Foundations for someone moving from 'I want to invest' to 'I trade with a plan.'",
  intermediate:
    "Derivatives, microstructure, multi-timeframe systems, and proper backtesting.",
  advanced:
    "Quantitative methods, vol trading, portfolio construction, algos, and trading as a business.",
};

function slugFromFilename(filename) {
  // "01-market-basics.md" -> { order: 1, slug: "market-basics" }
  const base = filename.replace(/\.md$/i, "");
  const m = base.match(/^(\d+)[-_](.+)$/);
  if (!m) return { order: 999, slug: base };
  return { order: parseInt(m[1], 10), slug: m[2] };
}

function extractTitle(body) {
  const m = body.match(/^#\s+(.+?)\s*$/m);
  if (!m) return null;
  // "1. Market Basics" -> "Market Basics"
  return m[1].replace(/^\d+\.\s*/, "").trim();
}

function escapeYaml(s) {
  return s.replace(/"/g, '\\"');
}

function buildFrontmatter({ title, description, tier, order, sourcePath }) {
  return [
    "---",
    `title: "${escapeYaml(title)}"`,
    `description: "${escapeYaml(description)}"`,
    `tier: ${tier}`,
    `order: ${order}`,
    `source: "${escapeYaml(sourcePath)}"`,
    "---",
    "",
  ].join("\n");
}

async function main() {
  const stat = await fs.stat(sourceRoot).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    console.error(`Source not found: ${sourceRoot}`);
    process.exit(1);
  }

  // Wipe destination tier dirs so removed chapters disappear too.
  for (const tier of [...Object.values(TIER_MAP), "special"]) {
    const dir = path.join(destRoot, tier);
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
  }

  // Mirror docs/assets/** -> public/trading-assets/** so chapter images resolve
  // at runtime via /trading-assets/...
  const assetsSrc = path.join(sourceRoot, "assets");
  await fs.rm(publicAssetsRoot, { recursive: true, force: true });
  let assetCount = 0;
  if (await fs.stat(assetsSrc).catch(() => null)) {
    await fs.cp(assetsSrc, publicAssetsRoot, { recursive: true });
    // Count copied files for the summary line.
    const walk = async (dir) => {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(p);
        else assetCount += 1;
      }
    };
    await walk(publicAssetsRoot);
  }

  let total = 0;
  let specialTotal = 0;
  for (const [srcDir, tier] of Object.entries(TIER_MAP)) {
    const fromDir = path.join(sourceRoot, srcDir);
    const files = (await fs.readdir(fromDir))
      .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
      .sort();

    for (const file of files) {
      const fromPath = path.join(fromDir, file);
      const raw = await fs.readFile(fromPath, "utf8");
      // Strip any pre-existing frontmatter so we can re-inject cleanly.
      const stripped = raw.replace(/^---\n[\s\S]*?\n---\n+/, "");
      const title = extractTitle(stripped) || file;

      // Files like `special-trading-journal.md` are not numbered chapters;
      // route them under tier="special" with a clean slug.
      const isSpecial = !/^\d+[-_]/.test(file);
      const tierForFile = isSpecial ? "special" : tier;
      const { order, slug } = isSpecial
        ? {
            order: 1,
            slug: file.replace(/\.md$/i, "").replace(/^special[-_]/i, ""),
          }
        : slugFromFilename(file);

      // Description = first paragraph (collapsed) after the H1, truncated.
      const afterH1 = stripped.replace(/^#\s+.+?\n+/, "");
      const firstPara = (afterH1.split(/\n\s*\n/)[0] || "")
        .replace(/[`*_>#]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const description =
        firstPara.length > 180 ? firstPara.slice(0, 177) + "…" : firstPara;

      const frontmatter = buildFrontmatter({
        title,
        description: description || TIER_DESCRIPTION[tier],
        tier: tierForFile,
        order,
        sourcePath: path.relative(repoRoot, fromPath),
      });

      // Rewrite asset references: `../assets/learn/04/foo.png` -> `/trading-assets/learn/04/foo.png`.
      // Covers both ![alt](url) and bare URLs in <img src="...">.
      const rewritten = stripped
        .replace(/(\!\[[^\]]*\]\()(?:\.\.\/)+assets\//g, "$1/trading-assets/")
        .replace(
          /(<img[^>]+src=["'])(?:\.\.\/)+assets\//gi,
          "$1/trading-assets/",
        )
        // Strip the trailing in-content "**Next:**/**Previous:**" navigation
        // lines and any horizontal rule that immediately precedes them. The
        // chapter page template already renders prev/next chrome.
        .replace(
          /\n+(?:---\s*\n+)?\*\*(?:Next|Previous|Prev|Back):\*\*[^\n]*\n?/gi,
          "\n",
        )
        // Strip "← [Back to ...]" / "← [Beginner] · [Intermediate] · [Advanced]"
        // footer-nav lines that some chapters end with — same reason.
        .replace(/\n+(?:---\s*\n+)?←[^\n]*\n?/g, "\n")
        .replace(/\s+$/, "\n");

      const destFile = isSpecial
        ? path.join(destRoot, "special", `${slug}.md`)
        : path.join(
            destRoot,
            tier,
            `${String(order).padStart(2, "0")}-${slug}.md`,
          );
      await fs.writeFile(destFile, frontmatter + rewritten);
      if (isSpecial) specialTotal += 1;
      else total += 1;
    }
  }

  console.log(
    `Synced ${total} chapters` +
      (specialTotal ? ` + ${specialTotal} specials` : "") +
      ` into ${path.relative(repoRoot, destRoot)}` +
      (assetCount
        ? ` and ${assetCount} assets into ${path.relative(repoRoot, publicAssetsRoot)}`
        : ""),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
