---
title: "HowLongToBeat Core"
description: "A TypeScript/Deno library to retrieve game completion times from HowLongToBeat.com. Works with Deno, Node.js, and browsers with full type definitions."
techStack:
  - TypeScript
  - Deno
coverImage: "@assets/images/blog/howlongtobeat/cover.svg"
category: "Libraries"
repoUrl: "https://github.com/tapanmeena/howlongtobeat-core"
liveUrl: "https://jsr.io/@tapan/howlongtobeat"
blogUrl: "/blog/libraries/howlongtobeat-core"
startDate: 2026-02-01
endDate: 2026-02-04
status: "completed"
featured: true
draft: false
---

## Overview

HowLongToBeat Core is a TypeScript library that provides programmatic access to game completion time data from HowLongToBeat.com. Built with Deno-first architecture, it runs seamlessly across Deno, Node.js, and browser environments with zero configuration.

Whether you're building a game backlog tracker, a gaming dashboard, or integrating playtime data into your application, this library offers a clean, type-safe API to fetch the information you need.

## Features

- 🎮 **Game Search** — Search games by name with fuzzy matching using dual similarity algorithms (Gestalt & Levenshtein)
- ⏱️ **Completion Times** — Get detailed playtime breakdowns: Main Story, Main + Extra, Completionist, and All Styles
- 📊 **Statistics API** — Fetch game statistics including releases, ratings, and popular games by year or platform
- 🔍 **Direct Lookup** — Retrieve game data directly by HowLongToBeat ID for precise queries
- 🎯 **Content Filtering** — Filter results to include or exclude DLCs, mods, and hacks
- 🌐 **Cross-Runtime** — Works with Deno, Node.js, and browsers out of the box
- 📦 **Dual Distribution** — Available on JSR (Deno) and npm (Node.js)
- 🔒 **Type-Safe** — Full TypeScript definitions with strict typing

## Usage

### Deno

```typescript
import { HowLongToBeat } from "jsr:@tapan/howlongtobeat";

const hltb = new HowLongToBeat();

// Search for a game
const results = await hltb.search("The Witcher 3");
console.log(results[0].gameplayMain); // Main story time in hours

// Get game by ID
const game = await hltb.getGameById(10270);
console.log(game.name, game.gameplayMainExtra);
```

### Node.js

```typescript
import { HowLongToBeat } from "howlongtobeat-core";

const hltb = new HowLongToBeat();

// Search with options
const results = await hltb.search("Elden Ring", {
  similarity: "levenshtein",
  includeDlc: false
});

// Get statistics
const stats = await hltb.getStats();
console.log(stats.popularGames);
```

## Tech Stack Details

| Technology | Purpose |
|------------|---------|
| **TypeScript** | Primary language with strict type checking |
| **Deno** | Runtime, testing, and build tooling |
| **JSR** | Deno package registry distribution |
| **npm** | Node.js package distribution |
| **DNT** | deno-to-node build pipeline for npm compatibility |

## Challenges

1. **API Reverse Engineering** — HowLongToBeat doesn't provide a public API. Required analyzing network requests and response structures to build a reliable client that handles pagination, search parameters, and data parsing.

2. **Dual Similarity Algorithms** — Implemented both Gestalt pattern matching and Levenshtein distance algorithms to provide flexible search result ranking, allowing users to choose the best fit for their use case.

3. **Cross-Runtime Compatibility** — Building a library that works identically across Deno, Node.js, and browsers required careful abstraction of runtime-specific APIs and a robust build pipeline using DNT (deno-to-node).

4. **Type Safety at Runtime** — Ensuring the untyped API responses are properly validated and transformed into strongly-typed TypeScript interfaces, with graceful handling of missing or malformed data.

## Outcomes

- 📦 Published on both JSR and npm for maximum accessibility
- 🧪 Comprehensive test suite with unit and integration tests
- 📖 Full API documentation with usage examples
- 🔄 Automated CI/CD pipeline for testing and publishing
