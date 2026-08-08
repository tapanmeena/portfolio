<!-- markdownlint-disable-file -->

---

title: Machine Room Page Planning Log
description: Decisions, discrepancies, and follow-on work for the machine-room page plan
ms.date: 2026-07-20
ms.topic: reference
---

## Planning Status

- Difficulty: Medium with durable planning requested
- Research: Complete
- Plan: Complete
- Implementation: Complete
- Review: Complete for implementation scope

## Planning Validation

- Prettier check passed for all four initial planning artifacts
- VS Code diagnostics reported no errors in `.copilot-tracking`
- All required plan sections and phase annotations are present
- All artifact cross-reference paths resolve in the workspace
- Removed catalogue material and private service domains are absent from the
  tracking artifacts
- Product build and browser validation remain deferred to implementation

## Discrepancy Log

### Section Label Collision

The early wireframe used section D. Repository search showed that Contact
already owns section D, while projects use A, writing uses B, trading and About
use C, and Cursed Knowledge uses X. The plan assigns Machine Room to section E.

Status: Resolved in research, plan, and details.

### Footer Numbering

The early concept placed the page in footer browsing without an abbreviation
decision. Existing destinations use stable values `00` through `07`, and those
values also appear in the primary header. Renumbering would create unnecessary
churn and potential inconsistency.

Selected resolution: Add Machine Room as `08` and leave every existing value
unchanged.

Status: Resolved in plan and details.

### Search Integration

The site search indexes blog, project, and trading content types. Adding a
static-page result would require widening `SearchItem`, updating filter state,
and changing result labels. The feature already has two explicit discovery
surfaces.

Selected resolution: Keep search integration out of scope for the first
release.

Status: Resolved in plan and details.

### Lucide Runtime Inspection

A direct Node 26 import of `@lucide/astro` failed because Node attempted to
strip TypeScript inside `node_modules`. This does not indicate missing icons;
the existing Astro code already imports the package through Vite.

Selected resolution: Verify proposed icon names in the installed generated
Lucide export source and validate them again through `astro check` and the
production build during implementation.

Status: Resolved for planning. Build validation remains an implementation
check.

## Implementation Paths Considered

### Selected Path

Use a typed `src/data/lab.ts` module, a page-scoped `src/pages/lab.astro`, a
small homepage teaser, and one footer entry. This path centralizes catalogue
content, keeps styling local, and limits the change to four product files.

### Content Collection Alternative

Not selected. The entries have no long-form bodies or independent routes, and
the collection would add schema and loader work without a matching authoring
benefit.

### Inline Page Data Alternative

Not selected. Homepage reuse would duplicate the public URL and increase the
chance that access labels drift.

### Header Navigation Alternative

Not selected. The primary header already carries seven destinations, and the
approved homepage plus footer entry points provide sufficient discovery.

### Mermaid Diagram Alternative

Not selected. A small semantic HTML and CSS map provides better visual control,
loads no client-side renderer, and can stack predictably on mobile.

## Plan Deviations

### Astro Check Runtime

The repository uses TypeScript 7.0.2, which does not expose the programmatic API
required by Astro Check. The project command was attempted and failed before
source diagnostics. Validation then ran through the temporary
`@astrojs/check@0.9.9` binary with a TypeScript 6 peer.

Result: 0 errors and 0 warnings. Existing repository hints remain out of scope.

### Existing File Formatting

The committed homepage already has 35 Prettier diff hunks, and the footer has
one. Formatting either entire file would create broad unrelated churn. New
files pass Prettier, and the homepage machine-room additions were normalized
until current drift matched the same 35-hunk baseline.

### Local Runtime Integrations

The production preview renders the page without exceptions. Local preview
returns 404 for Vercel Analytics and Speed Insights scripts because those
routes are supplied by Vercel after deployment. No application asset or page
request failed.

### Independent Validator Access

The Implementation Validator could not access workspace source and returned no
substantiated findings. A direct diff and source review completed the same
scope and found no feature defects.

## Implementation Validation

- The isolated catalogue TypeScript check passed
- Compatible Astro Check completed with 0 errors and 0 warnings
- Production build completed with 98 static pages
- `dist/lab/index.html` and the `/lab/` sitemap entry exist
- Source and generated-output security searches returned no forbidden matches
- Browser validation passed at `1440x900`, `1024x768`, `390x844`, and `360x800`
- Light mode, dark mode, focus order, reduced motion, and mobile action sizing
  passed
- Homepage quick navigation, teaser navigation, and footer navigation reach
  `/lab`
- Private and restricted entries contain no links or buttons

## Suggested Follow-On Work

1. Implement the four planned product-file changes
2. Validate private service access architecture independently of the website
3. Consider static-page search only if more editorial annex pages are added
4. Consider a sanitized read-only status source as a separate future feature
