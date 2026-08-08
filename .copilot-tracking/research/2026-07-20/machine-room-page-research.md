<!-- markdownlint-disable-file -->

---

title: Machine Room Page Research
description: Evidence and decisions for adding a public machine-room catalogue to the blog
ms.date: 2026-07-20
ms.topic: concept
---

## Scope

The requested feature is a public `/lab` page that presents selected self-hosted
systems without functioning as a private application launcher. The page must
fit the existing workshop-log design, expose only approved public links, and
remain useful without live status checks.

The approved catalogue contains five entries:

1. StalkMarket
2. Sentinel
3. Personal Media Cloud
4. Automated Media Pipeline
5. Operations Layer

The implementation also needs a homepage entry point and a footer link. The
primary header remains unchanged.

## Success Criteria

- The new static route is available at `/lab`
- The page uses the approved five-entry catalogue and three editorial groups
- Only StalkMarket has a public application link
- Sentinel links to its existing internal project page
- Private and restricted entries do not render links, disabled controls, or
  private subdomain names
- The page uses section E because section D is already assigned to Contact
- The homepage exposes a quick link and compact machine-room teaser
- The footer exposes the page without renumbering current destinations
- Desktop and mobile layouts match existing logbook patterns
- Light mode, dark mode, keyboard focus, and reduced motion remain usable
- Static type checking and production build validation pass

## Evidence Log

| Evidence                                                   | Finding                                                                              | Implementation Effect                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `src/pages/index.astro`                                    | Homepage content is constrained to `1080px` and uses numbered editorial rows         | Reuse its block headings, rules, spacing, and row proportions         |
| `src/pages/projects/index.astro`                           | Project rows use a `64px` mobile gutter and `90px` desktop gutter                    | Use the same row geometry for lab entries                             |
| `src/components/Header.astro`                              | Primary navigation already contains seven destinations                               | Do not add another header item                                        |
| `src/components/Footer.astro`                              | Footer destinations use stable string abbreviations from `00` through `07`           | Add Machine Room as `08` without changing existing values             |
| `src/pages/contact.astro`                                  | Contact already uses section D                                                       | Assign Machine Room to section E                                      |
| `src/pages/search-index.json.ts` and `src/utils/search.ts` | Search supports content collection types only                                        | Keep the static lab page outside search scope                         |
| `src/data/authors.ts` and `tsconfig.json`                  | Shared typed data lives under `src/data` and has an `@data/*` alias                  | Add a small typed `src/data/lab.ts` module                            |
| `astro.config.mjs`                                         | Output is static and sitemap integration is enabled                                  | The new static route should enter the generated sitemap automatically |
| `src/layouts/BaseLayout.astro`                             | Base metadata, theme, header, footer, analytics, and Mermaid loading are centralized | Use `BaseLayout`, but avoid Mermaid for the small system map          |
| `package.json`                                             | Astro check, Prettier, Lucide, and production build dependencies are installed       | Validate formatting, types, and the static build with existing tools  |
| Installed `@lucide/astro` exports                          | All approved service, access, and action icons are present                           | Use Lucide without adding logo assets or dependencies                 |

## Selected Approach

### Route and Ownership

Create `src/pages/lab.astro` as a static Astro page. Keep all page-specific CSS
scoped to that file. Do not expand global styles for a one-page feature.

### Data Model

Create `src/data/lab.ts` as a pure typed data module. It owns catalogue copy,
grouping, access classification, icon keys, stack labels, accents, and approved
actions. It must not import Astro components or perform network requests.

The page maps icon keys to Lucide components. This keeps the data portable and
avoids coupling shared content to Astro component types.

### Information Architecture

Render the entries in three ordered groups:

1. Built Here: StalkMarket and Sentinel
2. Hosted Here: Personal Media Cloud and Automated Media Pipeline
3. Control Plane: Operations Layer

Use access classification rather than operational status:

- Public
- Case study
- Private
- Restricted

### Visual System

Use numbered gutters, serif titles, monospace metadata, hairline rules, and
small Lucide icons. Product names appear only as stack text. Do not add service
logos, screenshots, rounded product tiles, or a card grid.

Include one semantic HTML and CSS system map after the catalogue. The map may
show public route, identity gate, Cloudflare edge, secure tunnel, home node,
Docker, and the four system categories. It must omit domains, ports, IP
addresses, versions, storage paths, and administrative routes.

### Discovery

Add a `/lab` item to the homepage quick navigation, a compact teaser after the
workshop-log section, and a footer item with abbreviation `08`. Keep the header
and search modal unchanged.

## Evaluated Alternatives

### Content Collection

Rejected because five fixed entries do not need Markdown bodies, dynamic
routes, schema loading, or authoring workflows. A content collection would add
configuration and generated types without reducing implementation complexity.

### Page-Local Data

Rejected because the homepage teaser needs catalogue-derived information. A
shared pure data module prevents copy and access-state drift.

### Product Logos and Screenshots

Rejected because they would turn the page into an application launcher, add
asset maintenance, and risk exposing private content. The site already uses
Lucide consistently.

### Live Service Status

Rejected for the initial implementation because build-time checks become
stale, client-side checks leak private endpoints, and a reliable status service
would expand the feature beyond a static showcase.

### Search Integration

Rejected for the initial implementation because search types and filters are
content-oriented. Homepage and footer discovery are sufficient for one static
page.

## Security Boundaries

- Store only the StalkMarket public URL in catalogue data
- Store Sentinel as an internal project link only
- Render no action element for private or restricted entries
- Do not include private subdomains in HTML, comments, data attributes, or CSS
- Do not fetch service health from the browser or during the build
- Do not render versions, ports, hostnames, storage details, or login paths
- Open public external links with `target="_blank"` and
  `rel="noopener noreferrer"`

## Actionable Next Steps

1. Implement the typed catalogue data
2. Build the static `/lab` page and scoped responsive styles
3. Add homepage and footer discovery links
4. Run format, type, build, security-content, and browser checks
