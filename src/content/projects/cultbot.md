---
title: "CultBot"
description: "A Node.js CLI and scheduled GitHub Action that automatically books your preferred Cult.fit classes, with priority-ordered workouts, waitlists, and retries."
techStack:
  - Node.js
  - JavaScript
  - GitHub Actions
  - REST APIs
  - Cron
category: "CLI Tools"
repoUrl: "https://github.com/tapanmeena/CultBot"
blogUrl: "/blog/cli-tools/cultbot"
startDate: 2026-07-05
endDate: 2026-07-06
status: "completed"
featured: true
draft: false
---

## Overview

Booking a Cult.fit class is a race. Cult.fit opens each day's schedule a few days ahead at 10 PM (book Monday night, you're booking Friday), and the popular morning slots fill within minutes of the window opening. The only way to reliably get your 7 AM strength class is to book the instant it opens. Every. Single. Night.

CultBot does that for you. It reads the class schedule, finds your preferred workout at your preferred time and center, and books it — or joins the waitlist when the class is full. Run it by hand, or let a scheduled GitHub Action book for you at 10 PM every night, the moment the new day opens.

## Features

- 🎯 **Priority-ordered preferences** — Lists your workouts and time slots in order and books the highest-priority match that's available
- ⏳ **Waitlist support** — Automatically joins the waitlist when a class is full
- 🔁 **Retries with backoff** — Exponential backoff on transient failures (429/5xx), fail-fast on auth errors
- 🧪 **Dry-run preview** — See exactly what would be booked without booking anything
- 🔍 **Discovery commands** — List every center, workout, and time slot to fill in your config
- 🩺 **Doctor command** — Validates configuration and confirms authentication before you rely on it
- 🔔 **Optional notifications** — Discord, Slack, Telegram, or a generic webhook
- 🤖 **Scheduled automation** — A ready-to-use GitHub Actions cron workflow

## How It Works

1. Fetches the current Cult.fit class schedule using your account cookies.
2. Selects the target day — by default the newest day that just opened (a few days out).
3. Stops early if you already have a booking that day.
4. Walks your preferred time slots in order, and within each slot picks the highest-priority workout that's available.
5. Books the class, or joins the waitlist when it's full and waitlisting is enabled.
6. Optionally sends a notification with the result.

Authentication is handled by pasting a `Copy as cURL` command from your browser's DevTools. CultBot parses out the headers and cookies it needs, so there are no passwords or app registrations to manage.

## Usage

```bash
# Book your preferred class for the target day
npm run book

# Dry run — show what would be booked without booking
npm run preview

# Discovery — fill in your .env
npm run list-centers
npm run list-workouts
npm run list-slots

# Validate config and test authentication
npm run doctor
```

One-off overrides go straight to the CLI:

```bash
node index.js book --dry-run
node index.js book --center 1018
node index.js list-slots --center 1018
```

## Configuration

CultBot reads everything from `.env` locally, or from GitHub secrets and variables in CI:

- `CURL_COMMAND` — a `Copy as cURL` request from your browser, used for authentication
- `PREFERRED_CENTER` — the center ID to book at
- `PREFERRED_SLOTS` — time slots to try, in priority order
- `PREFERRED_WORKOUTS` — workouts to book, in priority order
- `ENABLE_WAITLIST` — whether to join the waitlist when a class is full

## Architecture

The codebase is organized into small, single-purpose modules, with the schedule-parsing logic kept as pure functions that do no network IO — which makes the tricky "which class do I book?" logic easy to reason about and test.

| Module           | Responsibility                                        |
| ---------------- | ----------------------------------------------------- |
| `cli.js`         | Command routing and flag parsing                      |
| `config.js`      | Loads and validates configuration from `.env`         |
| `curl-parser.js` | Extracts auth headers and cookies from a curl command |
| `api-client.js`  | Cult.fit HTTP client with retries and backoff         |
| `schedule.js`    | Pure schedule-parsing helpers (no IO)                 |
| `booking.js`     | End-to-end booking orchestration                      |
| `discovery.js`   | `list-centers`, `list-workouts`, `list-slots`         |
| `notify.js`      | Optional Discord/Slack/Telegram/webhook notifications |
| `logger.js`      | Leveled, timestamped logging                          |

## Automation

A scheduled GitHub Actions workflow runs CultBot every night at 10 PM IST (22:01, cron `31 16 * * *` in UTC), just after the booking window opens. Credentials live in an encrypted `CURL_COMMAND` secret; preferences live in repository variables. A `workflow_dispatch` trigger with a dry-run toggle lets you test a run on demand. Because GitHub cron runs in UTC and can start a few minutes late under load, the schedule is set slightly early and the retry logic absorbs the rest.

## Challenges

1. **Stable matching** — Cult.fit's numeric workout IDs aren't stable across the catalogue, so matching is done on workout name (case-insensitive), sorted by the user's preference order.
2. **Auth without passwords** — Rather than automating a login, CultBot reuses your existing browser session by parsing a pasted curl command, keeping credentials out of code.
3. **Reliable retries** — Distinguishing retryable failures (timeouts, rate limits, 5xx) from fatal ones (401/403/404) so the bot backs off when it should and fails fast when it can't recover.
4. **Timing the window** — GitHub Actions cron drift meant the schedule needed a small head start plus retries to land the booking as soon as the window opens.

## Outcomes

- Booking a preferred class went from a timed 10 PM scramble to a hands-off scheduled run.
- Priority ordering means CultBot books the best available option automatically, with a fallback chain of workouts.
- Waitlist support quietly grabs a spot even when the class looks full.
