---
title: "Beat The Backlog"
description: "A Progressive Web App for tracking your gaming backlog using HowLongToBeat data, with wishlist management, trending games, and offline support."
techStack:
  - TypeScript
  - React
  - Vite
  - PWA
category: "Web Apps"
repoUrl: "https://github.com/tapanmeena/BeatTheBacklog"
startDate: 2025-12-31
status: "in-progress"
featured: true
draft: false
---

## Overview

Beat The Backlog is a Progressive Web App (PWA) for gamers who want to organize and track their gaming backlog. It integrates with HowLongToBeat's database to provide accurate game information and completion time estimates.

## Features

- **Search Games**: Search any game using HowLongToBeat's database
- **Wishlist**: Save games you're interested in playing
- **Backlog Management**: Organize games by status (Backlog, Playing, Completed, Dropped)
- **Trending Games**: See what's popular right now
- **Recent Releases**: Discover newly released games
- **Statistics**: Track your gaming stats (total games, completion rate, playtime)
- **PWA Support**: Install as a native app on any device
- **Offline Support**: Your collection is saved locally

## Game Status Types

- ⭐ **Wishlist** - Games you want to play someday
- 📚 **Backlog** - Games you own but haven't started
- 🎮 **Playing** - Games you're currently playing
- ✅ **Completed** - Games you've finished
- ❌ **Dropped** - Games you stopped playing

## Tech Stack Details

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express.js (API proxy for HowLongToBeat)
- **PWA**: Vite PWA Plugin + Workbox
- **Storage**: LocalStorage for user data

## API Endpoints

- `POST /api/search` - Search for games
- `GET /api/game/:id` - Get game details
- `GET /api/trending` - Get trending/popular games
- `GET /api/recent` - Get recently released games

## Challenges

Key challenges in building this app:

1. Creating a reliable proxy for HowLongToBeat API
2. Implementing robust offline-first PWA architecture
3. Designing an intuitive game status management flow
4. Optimizing for quick game searches and instant feedback

## Outcomes

Beat The Backlog helps gamers finally conquer their ever-growing pile of unplayed games with clear organization and progress tracking.
