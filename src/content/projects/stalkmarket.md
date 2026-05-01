---
title: "StalkMarket"
description: "A trailing stop-loss notification bot for the Indian stock market (NSE). Multi-broker (Angel One, Upstox, Zerodha, Groww), Telegram + Expo push notifications, an admin web dashboard, and a companion mobile app — all running on a Raspberry Pi 5 in Docker."
techStack:
  - TypeScript
  - Node.js 20
  - Fastify
  - better-sqlite3
  - Zod
  - Pino
  - Vitest
  - React
  - Vite
  - Expo
  - React Native
  - Docker
  - GitHub Actions
  - GHCR
  - Telegram Bot API
  - Expo Push
  - Angel One SmartAPI
  - Upstox API
  - Kite Connect
  - Groww API
category: "Fintech"
liveUrl: "https://stalkmarket.tapanmeena.com"
blogUrl: "/blog/fintech/stalkmarket-overview"
startDate: 2026-04-03
status: "in-progress"
featured: true
draft: false
---

> **Disclaimer.** StalkMarket is a personal project. It is not financial advice, not a registered advisory service, and not a substitute for your own judgement. Trading involves real risk of capital loss; use at your own discretion.

## Overview

Trailing stop-losses are simple in theory: let winners run, ratchet the stop upward, exit when the trend breaks. In practice they need constant attention. You end up refreshing your broker app every few minutes, recomputing stop prices in your head, and talking yourself out of perfectly good rules during the lunchtime chop.

StalkMarket automates the mechanical half of that loop. It polls live LTPs from your broker during NSE market hours, runs a pluggable trailing-stop strategy per position, and pushes a notification (Telegram and mobile push) the moment a stop is set, updated, or hit. Optionally, it can place the SELL MARKET exit for you on a Zerodha account.

The whole stack runs on a Raspberry Pi 5 in a single Docker container. State lives in SQLite (WAL mode), so a power cut won't cause a duplicate notification on restart.

## Highlights

- **Pluggable strategy engine.** Pure-function `Strategy` interface returning a discriminated `SKIP | STOP_SET | STOP_UPDATED | STOP_HIT` result. Trailing-stop today; ATR, Donchian, and breakeven sketched out.
- **Multi-broker.** Angel One (TOTP), Upstox and Zerodha (OAuth), Groww. Per-broker auth, persisted tokens, proactive refresh, and a one-shot 401 retry path, all behind one provider interface.
- **Safe order defaults.** Auto-execution is off by default, dry-run is on by default, and every attempt is deduplicated via a durable `order_executions` audit log so a restart never double-fires.
- **NSE-aware.** Market-hours gate (09:15–15:30 IST), holiday calendar fetched and cached from Upstox. No wasted polls on Diwali or Republic Day.
- **Three surfaces.** Fastify REST API (with `x-api-key` auth), a React/Vite admin dashboard, and an Expo / React Native mobile app with native push.
- **Crash-resilient.** SQLite WAL plus state-based dedupe (`last_notified_stop_price`) means a power cut, reboot, and resume cycle produces zero duplicate notifications.
- **Pi-friendly.** Multi-arch `linux/arm64` builds via `docker buildx`, CI to GHCR, runs in around 80 MB of RAM.

## Architecture at a glance

```
Poller (setInterval, market-hours gated)
  └─ Broker manager (auth mutex, token persistence, 401 retry)
        └─ getLTP() per user × stock
  └─ Trailing-stop strategy (pure function)
        └─ Result → DB write + notification dispatch
              ├─ Telegram (direct fetch)
              └─ Expo push (expo-server-sdk)
  └─ On STOP_HIT (if enabled) → Order manager → Zerodha SELL MARKET
```

## Tech choices worth a sentence

- **Fastify** over Express — schema-first, faster, fewer foot-guns.
- **better-sqlite3** — synchronous API, prebuilt arm64 binaries, single-file DB, perfect for a low-write workload.
- **Zod** — single source of truth: `app.json` validation and REST API body validation share schemas.
- **Pino** — structured JSON logs straight to Docker.
- **Vitest** — fast, ESM-native, broad coverage across `broker/`, `engine/`, `db/`, `api/`, `notifications/`.

## Read more

Three deep dives walk through the design decisions:

1. [Building StalkMarket — overview & architecture](/blog/fintech/stalkmarket-overview)
2. [Designing a pluggable trailing stop-loss engine](/blog/fintech/stalkmarket-trailing-stop-strategy)
3. [Multi-broker auth: TOTP, OAuth, and token persistence done right](/blog/fintech/stalkmarket-multi-broker-auth)
