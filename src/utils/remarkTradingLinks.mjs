// Rewrites markdown links inside trading chapters so cross-doc links built for
// the source repo resolve to live site URLs.
//
// Mappings (only applied to files under src/content/trading/):
//   ../learn/README.md         -> /trading/beginner
//   ../intermediate/README.md  -> /trading/intermediate
//   ../advanced/README.md      -> /trading/advanced
//   02-glossary.md             -> /trading/<currentTier>/02-glossary
//   ../learn/02-glossary.md    -> /trading/beginner/02-glossary
//   #anchor                    -> left untouched

import path from "node:path";
import { visit } from "unist-util-visit";

const TIER_DIR_TO_TIER = {
  learn: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

function resolveTradingLink(href, currentTier) {
  if (
    !href ||
    /^[a-z]+:/i.test(href) ||
    href.startsWith("#") ||
    href.startsWith("/") ||
    href.startsWith("mailto:")
  ) {
    return href;
  }

  // Strip optional anchor.
  const [pathPart, anchor] = href.split("#");
  if (!pathPart) return href; // pure anchor

  // Normalise relative path.
  const segments = pathPart.split("/");
  const file = segments.pop() || "";

  // Resolve which tier the link points to.
  // Specials live outside the tier hierarchy; sibling links from a special
  // file (e.g. README.md) refer to the source repo's `learn/` folder, so
  // default to the beginner tier in that case.
  let targetTier = currentTier === "special" ? "beginner" : currentTier;
  for (const seg of segments) {
    if (seg === "." || seg === "..") continue;
    if (TIER_DIR_TO_TIER[seg]) targetTier = TIER_DIR_TO_TIER[seg];
  }

  if (!file) return href;

  const lower = file.toLowerCase();
  if (lower === "readme.md" || lower === "readme") {
    return `/trading/${targetTier}${anchor ? "#" + anchor : ""}`;
  }

  if (!/\.md$/i.test(file)) return href;
  const slug = file.replace(/\.md$/i, "");
  return `/trading/${targetTier}/${slug}${anchor ? "#" + anchor : ""}`;
}

export default function remarkTradingLinks() {
  return (tree, file) => {
    const filePath = file?.history?.[0] || file?.path || "";
    if (!filePath.includes(path.join("src", "content", "trading"))) return;

    // Determine current tier from file path.
    const parts = filePath.split(path.sep);
    const tradingIdx = parts.lastIndexOf("trading");
    const currentTier = tradingIdx >= 0 ? parts[tradingIdx + 1] : "beginner";

    visit(tree, "link", (node) => {
      node.url = resolveTradingLink(node.url, currentTier);
    });
    visit(tree, "definition", (node) => {
      node.url = resolveTradingLink(node.url, currentTier);
    });
  };
}
