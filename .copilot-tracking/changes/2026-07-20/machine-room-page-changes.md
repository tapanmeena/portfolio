<!-- markdownlint-disable-file -->

---

title: Machine Room Page Changes
description: Implementation and validation record for the public machine-room catalogue
ms.date: 2026-07-20
ms.topic: reference
---

## Related Plan

`.copilot-tracking/plans/2026-07-20/machine-room-page-plan.instructions.md`

## Implementation Date

2026-07-20

## Summary

Added a static `/lab` catalogue for five approved systems, with explicit access
classifications, scoped responsive styling, a sanitized traffic map, homepage
discovery, and footer navigation. Private and restricted systems remain
non-interactive.

## Added

### `src/data/lab.ts`

- Typed access, group, icon, entry, and group metadata contracts
- Five approved catalogue entries in stable display order
- Approved StalkMarket public URL and StalkMarket/Sentinel project routes only

### `src/pages/lab.astro`

- Section-E dateline, masthead, summary, introduction, and access key
- Three grouped numbered catalogue sections
- Lucide service, access, and action icons
- Explicit actions for StalkMarket and Sentinel only
- Sanitized semantic HTML and CSS traffic map
- Responsive light/dark styles, focus treatment, and reduced-motion support

## Modified

### `src/pages/index.astro`

- Added Machine Room to quick navigation
- Added a three-item homepage teaser between workshop and writing sections
- Reused shared catalogue data for public, private, and restricted summaries
- Kept private and restricted teaser items non-interactive

### `src/components/Footer.astro`

- Added `/lab` as `08 machine room` without renumbering existing destinations

## Removed

No product code or content was removed.

## Additional or Deviating Changes

- Replaced deprecated `Globe2` with `Globe` after compatible Astro diagnostics
- Moved the masthead preface outside the H1 so the accessible heading name is
  exactly "the machine room"
- Preserved unrelated worktree changes in `.timetracker` and Footer markup

## Validation

- New source files pass Prettier
- Homepage additions add no Prettier drift beyond the committed baseline
- Compatible Astro Check reports 0 errors and 0 warnings
- `pnpm build` passes and generates 98 static pages
- `/lab/` exists in generated output and sitemap
- Security scans found no removed names, private domains, ports, or login paths
- Browser validation passed all required desktop/mobile sizes and themes
- Keyboard focus, reduced motion, external-link attributes, and navigation pass
- Local production preview has no page exceptions; only Vercel-hosted analytics
  scripts return expected local 404 responses

## Release Summary

The website now presents its public builds, private media systems, automation,
and operations layer as an editorial machine-room catalogue. Visitors can open
StalkMarket or read approved project case studies without receiving links to
private infrastructure.
