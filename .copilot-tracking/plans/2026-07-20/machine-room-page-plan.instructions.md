<!-- markdownlint-disable-file -->

---

description: "Implementation plan for the public machine-room catalogue"
applyTo: "src/data/lab.ts,src/pages/lab.astro,src/pages/index.astro,src/components/Footer.astro"
---

# Machine Room Page Implementation Plan

## User Requests

- Showcase selected self-hosted systems on the public website without turning
  the site into a private application launcher
- Use a dedicated `/lab` page titled "The Machine Room"
- Classify public, case-study, private, and restricted entries explicitly
- Keep private systems non-clickable and omit sensitive routing details
- Use the approved five-entry catalogue
- Match the existing workshop-log design on desktop and mobile
- Use Lucide icons and restrained accents instead of product logos or private
  screenshots
- Include a sanitized architecture visual
- Add homepage and footer discovery without adding another primary header item
- Prepare the implementation plan before making product changes

## Overview

Add a static machine-room catalogue that explains what runs behind the public
site while preserving a strict public/private boundary. A shared typed data
module supplies five entries to a new Astro page and the homepage teaser. Page
styles remain local, and existing navigation, search, content collections, and
global tokens remain stable.

## Objectives

- Extend the site's editorial information architecture with section E
- Present systems as engineering capabilities rather than launchable apps
- Reuse established typography, rules, spacing, and numbered-row patterns
- Make access classification understandable without relying on color
- Keep the implementation static, dependency-free, and easy to audit
- Validate appearance and security boundaries across desktop and mobile

## Context Summary

Research source:

- `.copilot-tracking/research/2026-07-20/machine-room-page-research.md`

Implementation details:

- `.copilot-tracking/details/2026-07-20/machine-room-page-details.md`

Planning log:

- `.copilot-tracking/plans/logs/2026-07-20/machine-room-page-log.md`

Applicable instructions:

- `/Users/tapan/.vscode/extensions/ise-hve-essentials.hve-core-3.2.2/.github/instructions/shared/hve-core-location.instructions.md`
- `/Users/tapan/.vscode/extensions/ise-hve-essentials.hve-core-3.2.2/.github/instructions/hve-core/markdown.instructions.md`
- `/Users/tapan/.vscode/extensions/ise-hve-essentials.hve-core-3.2.2/.github/instructions/hve-core/writing-style.instructions.md`
- `/Users/tapan/.vscode/extensions/ise-hve-essentials.hve-core-3.2.2/.github/instructions/hve-core/prompt-builder.instructions.md`

## Scope

### Included Files

- Add `src/data/lab.ts`
- Add `src/pages/lab.astro`
- Modify `src/pages/index.astro`
- Modify `src/components/Footer.astro`

### Excluded Files and Features

- `src/components/Header.astro`
- `src/pages/search-index.json.ts`
- `src/utils/search.ts`
- `src/content.config.ts`
- Global CSS changes
- New dependencies or product-logo assets
- Live status checks or private service requests
- Private subdomain links
- Authentication or infrastructure configuration

## Implementation Checklist

### Phase 1: Typed Catalogue Data

<!-- parallelizable: false -->

- [x] Add access, group, and icon-key union types to `src/data/lab.ts`
- [x] Add a `LabEntry` interface with copy, stack, grouping, access, accent,
      icon key, and optional approved actions
- [x] Add the five approved entries in stable display order
- [x] Store only the StalkMarket external application URL
- [x] Store project routes for StalkMarket and Sentinel
- [x] Export group metadata for Built Here, Hosted Here, and Control Plane
- [x] Keep the module free of Astro component imports and runtime behavior

### Phase 2: Static Lab Page

<!-- parallelizable: false -->

- [x] Add `src/pages/lab.astro` using `BaseLayout`
- [x] Import and map the approved Lucide service, access, and action icons
- [x] Render section-E dateline, masthead, introduction, and four-cell summary
- [x] Render a text-and-icon access legend
- [x] Render grouped numbered entries from shared data
- [x] Render actions only when an approved route or URL exists
- [x] Add the semantic HTML and CSS traffic map
- [x] Add a field note explaining the public/private policy
- [x] Add scoped styles using existing color and font variables
- [x] Preserve `64px` mobile and `90px` desktop row gutters
- [x] Stack metadata, copy, and actions cleanly below `600px`
- [x] Use two-column summary and intro layouts at existing breakpoints
- [x] Add clear keyboard focus styles and reduced-motion handling
- [x] Ensure status meaning is not conveyed through color alone

### Phase 3: Homepage and Footer Discovery

<!-- parallelizable: false -->

- [x] Add "the machine room" to the homepage quick navigation
- [x] Add a compact machine-room teaser after the workshop-log section and
      before the writing-log section
- [x] Derive the public entry from shared lab data rather than duplicating its
      URL
- [x] Link the teaser heading and public entry while keeping private summaries
      as plain text
- [x] Add responsive teaser styles scoped to `src/pages/index.astro`
- [x] Add Machine Room to the footer with route `/lab` and abbreviation `08`
- [x] Leave all existing footer abbreviations unchanged
- [x] Leave primary header navigation unchanged

### Phase 4: Validation and Review

<!-- parallelizable: false -->

- [x] Format new files and additions with the repository Prettier configuration
      while preserving unrelated baseline formatting in existing files
- [x] Run Astro Check through a temporary TypeScript 6 peer because project
      TypeScript 7 does not expose the required checker API
- [x] Run `pnpm build`
- [x] Confirm the production output contains `/lab/index.html`
- [x] Search changed source and built HTML for private subdomains, ports,
      versions, storage paths, and login routes
- [x] Confirm only StalkMarket renders an external application action
- [x] Confirm Sentinel renders only its internal project action
- [x] Confirm private and restricted entries render no anchors or buttons
- [x] Start the development server and inspect `/lab` in light and dark modes
- [x] Capture desktop screenshots at `1440x900` and `1024x768`
- [x] Capture mobile screenshots at `390x844` and `360x800`
- [x] Verify no horizontal overflow, text collision, clipped actions, or layout
      shifts at each viewport
- [x] Verify keyboard focus order and visible focus treatment
- [x] Verify external-link target and `rel` attributes
- [x] Verify the homepage teaser and footer link navigate to `/lab`
- [x] Review final changes against every user request before completion

## Dependencies

Existing dependencies only:

- Astro and `BaseLayout`
- `@lucide/astro`
- Existing CSS variables and fonts
- Existing sitemap integration
- Prettier and `prettier-plugin-astro`
- `@astrojs/check`
- Browser automation available through the VS Code Playwright tools

No additional skill is required. No new package installation is planned.

## Success Criteria

- `/lab` builds as a static page and appears in the generated sitemap
- Exactly five approved entries render in the correct groups and order
- The page uses section E and the approved title and supporting copy
- All icon imports resolve from the installed Lucide package
- Private and restricted entries have no interactive destination
- Only approved project and public application actions render
- The architecture map reveals no sensitive routing or deployment details
- Homepage quick navigation, teaser, and footer link reach `/lab`
- Header and search behavior remain unchanged
- Layout and content pass desktop, mobile, light, dark, keyboard, type, and
  production-build validation
