---
title: "Building an eBook Reader with Expo and epub.js"
description: "How I built Shelvr — a local-first eBook reader with EPUB parsing, reading progress persistence, and a data model designed for Komga server integration."
publishedAt: 2026-03-24
category: Mobile Apps
tags:
  - React Native
  - Expo
  - TypeScript
  - eBook
  - EPUB
  - SQLite
  - Open Source
author: "Tapan Meena"
draft: true
---

I read a lot of eBooks — mostly EPUBs served from my [Komga](https://komga.org/) server. Every reader app I tried was either ugly, locked into a proprietary ecosystem, or had zero concept of connecting to a self-hosted book server.

So I built my own. **Shelvr** is a cross-platform eBook reader built with Expo. It extracts metadata and covers from imported EPUBs, offers a customizable reading experience, and persists your progress — all locally on your phone, with Komga integration planned from day one.

[View on GitHub](https://github.com/tapanmeena/Shelvr)

---

## The Problem with eBook Readers

If you're into self-hosted media — Jellyfin for movies, Navidrome for music, Komga for books — you know the pattern. The server software is excellent. The mobile clients? An afterthought.

Most EPUB readers fall into one of three buckets:

- **Proprietary** — locked to a specific store (Kindle, Apple Books, Kobo)
- **Feature-bloated** — try to do everything and do nothing well
- **Self-hosted-unaware** — great readers, but no way to connect to your own book server

I wanted something simple, beautiful, and eventually Komga-aware. Expo made it realistic to build without a 6-month timeline.

---

## Choosing the Right Tools

The biggest decision: how to render EPUB content. EPUBs are basically small websites inside a ZIP file — XHTML, CSS, images, fonts. Building a text engine from scratch would be insane.

I went with **[epub.js](https://github.com/futurepress/epub.js)** wrapped in a React Native WebView via `@epubjs-react-native/core`. Battle-tested rendering without reinventing text layout.

The guiding principle for everything else was **local-first** — everything works offline, server sync comes later.

- **@epubjs-react-native/core** — epub.js in a WebView for rendering
- **expo-sqlite** — source of truth for books and reading progress
- **Zustand** + AsyncStorage — reactive state with instant rehydration on launch
- **JSZip** — EPUB metadata extraction without a native XML parser
- **Zod** — runtime schema validation
- **expo-router** — file-based navigation (drawer + stack)
- **expo-document-picker** — EPUB file imports
- **expo-haptics** — tactile feedback

---

## What Happens When You Import a Book

The most interesting part of the app. Tap "Import", select an EPUB, and a lot happens in about 1-2 seconds.

### EPUBs Are Just ZIP Files (With Quirks)

An EPUB is a ZIP archive containing XML, XHTML, stylesheets, images, and a metadata manifest. The challenge isn't reading it — it's reading it _robustly_ across the wild variety of files out there.

Instead of a heavy XML parser, I went with **JSZip + regex**. Sounds hacky, works surprisingly well. The parser opens the ZIP, finds the container manifest, then extracts title, authors, description, series info, and cover image using lightweight regex helpers that handle both EPUB 2 and EPUB 3 conventions.

### The Four-Strategy Cover Hunt

Cover extraction was trickier than expected. EPUB 2 and EPUB 3 use different conventions, and many publishers do their own thing.

Shelvr tries **four strategies** in priority order:

1. **EPUB 3 standard** — manifest item with `properties="cover-image"`
2. **ID-based** — item with "cover" in its ID
3. **EPUB 2 meta tag** — `<meta name="cover" content="some-id"/>`, then resolve the ID
4. **Common naming patterns** — image items named `cover`, `cover-image`, or `coverimage`

This catches about 99% of EPUBs. When found, the cover is extracted as base64 and saved to the filesystem.

### The Full Pipeline

After parsing, the EPUB is copied into app-private storage under a UUID directory, the cover is saved separately for fast thumbnails, and a book record is inserted into SQLite. The whole pipeline runs in about a second for a typical novel.

---

## The Reading Experience

The reader wraps epub.js in a WebView — proper text reflow, swipe-based page turning, text selection, and accurate position tracking out of the box.

Shelvr adds a **theme system** with three modes: light, dark, and sepia. Each theme is injected as CSS into the WebView. Getting sepia right — that warm, paper-like feel — took more iteration than expected.

Fonts include system default, Georgia, Palatino, Bookerly, and **OpenDyslexic** for accessibility. All preferences persist across restarts via Zustand.

The **table of contents** highlights the active chapter and its parent, auto-scrolls to your current position, and triggers haptic feedback on selection. Small details that make navigating a 500-page book feel natural.

---

## The Tricky Part: Saving Your Place

Reading progress seems simple — just save where the user stopped. In practice, it involves three persistence strategies working together.

### The Position Problem

epub.js uses [Canonical Fragment Identifiers (CFI)](http://www.idpf.org/epub/linking/cfi/) to pinpoint exact positions — like a precise address within the book's HTML structure.

But CFIs don't tell you _how far through_ the book you are. For percentages, epub.js needs to generate a "locations map" of the entire book. That's expensive — 1-3 seconds per book the first time.

### Debounced Saves

Saving on every scroll would thrash the database. Instead, `useReader` debounces writes with a significance threshold: progress is only saved if it changed by at least 1% or the CFI is different. The 1-second timer batches rapid page turns while still capturing meaningful progress.

### Caching Expensive Computations

The locations generation only needs to happen **once per book**. After that, the array is cached in AsyncStorage and reused as `initialLocations` on subsequent opens — percentage tracking available instantly, no spinner.

Invisible when it works, but you'd notice the delay without it.

---

## Local-First, Server-Ready

Shelvr's core principle: **local-first, server-optional**. Everything works offline. The data model is designed for Komga from day one.

### The Schema Tells the Story

The SQLite `books` table has a `source` field (`'local'` or `'komga'`), plus `komga_book_id` and `komga_server_id` columns with indexes — all empty for now, ready for when server sync arrives.

Adding these later would mean migrations and potential bugs. Adding them upfront costs nothing and makes Komga integration an **additive change**, not a risky refactor.

### What Komga Integration Will Look Like

1. **Authenticate** — HTTP Basic auth, credentials in `expo-secure-store`
2. **Browse** — Fetch libraries and books from the Komga API, display alongside local books with a cloud badge
3. **Download** — Queue-based downloading into the same `books/` directory
4. **Sync progress** — Push reading position to Komga's API, latest timestamp wins

The UI already scaffolds some of this — `BookCard` shows a cloud badge for Komga books, and the delete modal warns that removing a Komga book only deletes the local copy.

---

## Small Details That Matter

**Responsive grid** — Columns calculated dynamically from screen width. Combined with FlatList tuning (`getItemLayout`, `removeClippedSubviews`, batched rendering), the library stays smooth with hundreds of books.

**Deterministic placeholder covers** — Books without covers get a color based on a title hash. Same book, same color, no flickering. Makes a coverless library look intentional.

**Haptic feedback** — Chapter selection, long-press actions. Small vibrations that make the app feel native.

---

## What's Next

- **Komga server connection** — browse libraries, download books, sync progress
- **Bookmarks & annotations** — highlight passages, add notes
- **In-book search** — full-text search within EPUBs
- **OPDS catalog support** — connect to any OPDS-compatible book server
- **Cross-device sync** — reading position that follows you between devices

---

## What I Learned

**EPUBs are surprisingly inconsistent.** The format is standardized, but publishers take liberties. My four-strategy cover cascade exists because real-world EPUBs don't follow the spec. Test with a wide variety of files.

**epub.js is an incredible shortcut.** Wrapping it in a WebView gives you a production-grade reader for free. Zero time on text layout — and the result is better than anything I'd build from scratch.

**Design your data model for the future.** Adding Komga fields from day one was a 5-minute decision that'll save hours of migration work later.

**Local-first is the right default.** Every feature works offline. Server sync enhances the experience but never gates it. For apps dealing with content the user owns, this feels like the only right approach.

Expo + SQLite + Zustand is a fantastic local-first foundation. Mature enough that you spend time on your app's unique value, not fighting the framework.

[GitHub](https://github.com/tapanmeena/Shelvr) · [Blog](https://tapanmeena.com/blog)
