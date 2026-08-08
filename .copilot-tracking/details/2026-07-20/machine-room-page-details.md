<!-- markdownlint-disable-file -->

---

title: Machine Room Page Implementation Details
description: File operations, data contracts, layout rules, and validation details for the lab page
ms.date: 2026-07-20
ms.topic: reference
---

## Context References

- Plan: `.copilot-tracking/plans/2026-07-20/machine-room-page-plan.instructions.md`
- Research: `.copilot-tracking/research/2026-07-20/machine-room-page-research.md`
- Planning log: `.copilot-tracking/plans/logs/2026-07-20/machine-room-page-log.md`
- Existing homepage pattern: `src/pages/index.astro`
- Existing row pattern: `src/pages/projects/index.astro`
- Existing project actions: `src/pages/projects/[...slug].astro`
- Shared layout: `src/layouts/BaseLayout.astro`
- Shared data convention: `src/data/authors.ts`

## Phase 1 Details

### Add `src/data/lab.ts`

Define narrow string unions:

```ts
export type LabAccess = "public" | "case-study" | "private" | "restricted";
export type LabGroup = "built" | "hosted" | "operations";
export type LabIcon = "market" | "camera" | "media" | "workflow" | "gauge";
```

Define a pure data interface with these fields:

```ts
export interface LabEntry {
  id: string;
  title: string;
  description: string;
  group: LabGroup;
  access: LabAccess;
  icon: LabIcon;
  accent: string;
  stack: string[];
  projectUrl?: string;
  liveUrl?: string;
}
```

Keep numbering derived from array order. Do not persist display numbers in the
data because reordering would otherwise require two edits.

Create entries in this exact order:

| ID                         | Title                    | Group        | Access       | Icon       | Accent    | Actions                        |
| -------------------------- | ------------------------ | ------------ | ------------ | ---------- | --------- | ------------------------------ |
| `stalkmarket`              | StalkMarket              | `built`      | `public`     | `market`   | `#10b981` | Project and public application |
| `sentinel`                 | Sentinel                 | `built`      | `case-study` | `camera`   | `#14b8a6` | Project only                   |
| `personal-media-cloud`     | Personal Media Cloud     | `hosted`     | `private`    | `media`    | `#3b82f6` | None                           |
| `automated-media-pipeline` | Automated Media Pipeline | `hosted`     | `restricted` | `workflow` | `#f59e0b` | None                           |
| `operations-layer`         | Operations Layer         | `operations` | `restricted` | `gauge`    | `#06b6d4` | None                           |

Export ordered group metadata:

| ID           | Label         | Supporting Label |
| ------------ | ------------- | ---------------- |
| `built`      | Built Here    | 2 entries        |
| `hosted`     | Hosted Here   | 2 entries        |
| `operations` | Control Plane | 1 entry          |

Group counts should be derived at render time so supporting labels cannot drift
when catalogue data changes.

### Phase 1 Success Criteria

- TypeScript accepts every entry without casts
- Only approved action fields exist
- No component imports, environment reads, or network calls exist
- Array order matches the approved catalogue

## Phase 2 Details

### Add `src/pages/lab.astro`

Import these Lucide components:

- `ChartCandlestick`
- `Cctv`
- `Images`
- `Workflow`
- `Gauge`
- `Globe2`
- `FileText`
- `LockKeyhole`
- `ShieldCheck`
- `ExternalLink`

Create page-local icon maps keyed by `LabIcon` and `LabAccess`. Use visible
access text beside every access icon.

Use this metadata:

- Page title: `The Machine Room - Tapan Meena`
- Description: `A field guide to the self-hosted services, Raspberry Pi projects, and quiet infrastructure running behind the workshop.`
- Dateline section: `section E // the machine room`
- Masthead preface: `a field inventory of`
- H1: `the machine room`
- Supporting line: `small systems, kept alive`
- Policy line: `self-hosted · private by default · public on purpose`

Use ASCII punctuation in source where practical. The middle-dot separators may
remain because the site already uses them throughout visible metadata.

### Page Structure

Render these blocks in order:

1. Dateline
2. Masthead and hairline rules
3. Four-cell summary
4. Introductory copy and access legend
5. Built Here group
6. Hosted Here group
7. Control Plane group
8. Sanitized traffic map
9. Field note

The four summary cells are:

- `05` entries
- `02` built here
- `01` public
- `private` default

Derive the numeric values from data. The policy cell remains static text.

### Entry Rendering

Use an `article` or `li` as the row container. Do not wrap the entire row in an
anchor because StalkMarket has two destinations and private rows have none.

Desktop row grid:

```text
90px numbered gutter | minmax(0, 1fr) content | auto access/actions
```

Mobile row flow:

```text
number and access
title and service icon
description
stack
actions when present
```

Actions:

- `read the build` links to `/projects/stalkmarket`
- `open public demo` links to the approved StalkMarket URL in a new tab
- `read case study` links to `/projects/sentinel`
- No other action element renders

### Traffic Map

Implement the map with semantic containers and CSS lines. Use these public
labels only:

```text
Public visitor
Trusted device
Public route
Identity gate
Cloudflare edge
Secure tunnel
Home node / Docker
Built
Media
Automation
Operations
```

Do not use Mermaid. The map is static, small, and needs exact responsive
control without a client-side rendering dependency.

Desktop layout can branch horizontally. Below `720px`, switch to a vertical
flow with arrows or border connectors. Decorative connectors use
`aria-hidden="true"`; the labels remain in readable document order.

### Scoped Styling

Follow these existing measurements:

- Page maximum width: `1080px`
- Page horizontal padding: `1.25rem`
- Mobile entry gutter: `64px`
- Desktop entry gutter: `90px`
- Mobile-to-desktop row breakpoint: `600px`
- Summary breakpoint: `640px`
- Intro and map breakpoint: `720px`
- Large decorative labels, if used, appear only above `920px`

Use existing variables:

- `--color-bg`
- `--color-text`
- `--color-muted`
- `--color-border`
- `--color-surface`
- `--color-accent`

Use entry accents only for service icons and a `2px` row marker. Do not recolor
body copy or access text with raw accent values.

Add explicit `:focus-visible` treatment to action links. Under
`prefers-reduced-motion: reduce`, disable nonessential transitions. Do not add
pulsing status animations.

### Phase 2 Success Criteria

- Page renders all groups and entries from shared data
- Accessible names distinguish internal and external actions
- Private rows have no false affordance or nested interactive content
- Mobile map and rows avoid horizontal overflow
- Light and dark themes use existing tokens only

## Phase 3 Details

### Modify `src/pages/index.astro`

Import `labEntries` from `@data/lab`. Derive the public entry with an access
predicate and use its approved URL for the teaser.

Add `the machine room` to the quick-navigation list after `the workshop log`.

Insert the teaser after the workshop-log block and before the writing-log
block. Use the existing `.block` and `.block-head` structure where possible.
The teaser contains three compact columns:

1. Public Build: StalkMarket, linked externally
2. Private Systems: Personal Media Cloud, plain text
3. Restricted Ops: Automation and monitoring, plain text

Link the block heading to `/lab`. Do not make the full teaser container
clickable.

At narrow widths, stack teaser columns as bordered rows. Keep dynamic content
from changing the block height on hover.

### Modify `src/components/Footer.astro`

Add this item to the `browse` collection:

```ts
{ href: "/lab", label: "machine room", abbr: "08" }
```

Keep current abbreviations `00` through `07` unchanged. Do not add the route to
the primary header.

### Phase 3 Success Criteria

- Homepage exposes `/lab` through quick navigation and the teaser heading
- Only the public teaser item is externally interactive
- Footer exposes `/lab` with abbreviation `08`
- Existing header, search, and footer numbering remain stable

## Phase 4 Details

### Static Validation

Run these commands after implementation:

```bash
pnpm exec prettier --check src/data/lab.ts src/pages/lab.astro src/pages/index.astro src/components/Footer.astro
pnpm exec astro check
pnpm build
```

Confirm these generated artifacts:

- `dist/lab/index.html`
- A `/lab/` URL in the generated sitemap

Search the changed source and `dist/lab/index.html` for unintended private
domains, port patterns, login paths, version labels, and storage-path terms.
The only approved application hostname is the StalkMarket public hostname.

### Browser Validation

Start the local development server and use browser automation to capture:

| Viewport   | Theme          | Required Checks                                |
| ---------- | -------------- | ---------------------------------------------- |
| `1440x900` | Light and dark | Full page, row alignment, map branches, footer |
| `1024x768` | Light          | Intro balance, no crowding, stable actions     |
| `390x844`  | Light and dark | Stacked rows, action wrapping, map flow        |
| `360x800`  | Light          | Long labels fit, no horizontal overflow        |

At every viewport, compare `document.documentElement.scrollWidth` with
`window.innerWidth`. Inspect focus order with keyboard navigation. Verify that
private and restricted rows contain no anchors or buttons.

### Phase 4 Success Criteria

- Formatting, Astro check, and production build pass
- Static output includes the route and sitemap entry
- Browser screenshots show no overlap, clipping, or unintended blank regions
- Security-content searches return no unintended details
- All user requests are fulfilled without out-of-scope changes

## Discrepancy References

The planning log records two resolved discrepancies:

- The initial section label conflicted with an existing page and changed to E
- Direct Node execution could not import Lucide under Node 26, so export
  availability was verified from the installed generated source instead
