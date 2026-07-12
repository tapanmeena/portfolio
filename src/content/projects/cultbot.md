---
title: "CultBot"
description: "CultBot is a YAML-driven Node.js CLI for Cult.fit class booking, with date-based profiles, priority rules, notifications, retries, and flexible deployment."
techStack:
  - Node.js
  - JavaScript
  - YAML
  - GitHub Actions
  - Docker
  - systemd
  - REST APIs
  - Cron
category: "CLI Tools"
repoUrl: "https://github.com/tapanmeena/CultBot"
blogUrl: "/blog/cli-tools/cultbot"
startDate: 2026-07-05
endDate: 2026-07-12
status: "completed"
featured: true
draft: false
---

## Overview

Booking a popular Cult.fit class can become a nightly race. CultBot turns that repeated task into one deterministic command: fetch the live schedule, select the class date to book, apply its booking rules, choose the best time, center, and workout combination, then book it or join its waitlist.

A booking pass is one complete run from schedule lookup to booking or skip, after which the CLI exits. This keeps booking logic independent from scheduling, so the same code can run manually, in an opt-in GitHub Action, from a Raspberry Pi systemd timer, through cron, or inside a Docker container.

## Features

- Versioned YAML configuration separates booking policy from secrets
- Named profiles group the centers, times, workouts, and waitlist settings for alternate routines
- Weekday rules, exact-date overrides, and `skip: true` model changing routines and rest days
- Configurable `selectionOrder` sets the priority among times, centers, and workouts in any of six orders
- Exact clock-time slots can be combined with a flexible live-schedule time range
- Strict offline validation rejects unknown fields, invalid dates and times, and ambiguous YAML
- Dry runs exercise selection without booking, while resolved-date inspection, authentication checks, and notification tests catch other failures in stages
- Selective retries use progressively longer delays for timeouts, rate limits, and server errors
- Discord, Slack, Telegram, and generic webhook notifications report booking outcomes
- GitHub Actions, systemd, cron, and Docker provide mutually exclusive scheduling paths

## How It Works

1. Fetches the current Cult.fit class schedule using your account cookies.
2. Selects the first, last, or an explicit date from the live schedule.
3. Resolves an exact-date rule, a weekday rule, or the default profile.
4. Stops if that date is skipped or already has a booking at any center.
5. Combines preferred slots with live times inside an optional time range.
6. Iterates time, center, and workout candidates according to `selectionOrder`.
7. Books the first allowed class or joins its waitlist when enabled.
8. Logs and optionally notifies the result with the center name and ID.

Authentication comes from a `Copy as cURL` command captured in browser DevTools. CultBot extracts the required headers and cookies, so there is no password storage, login automation, or app registration.

## Usage

```bash
npm run book
npm run preview
npm run config:validate
npm run doctor
npm run test-notify
npm run list-centers
npm run list-workouts
npm run list-slots
npm run help
```

Date resolution and one-off overrides are available directly from the CLI:

```bash
node index.js config show --date 2030-01-07
node index.js book --dry-run
node index.js book --center 1001
node index.js book --date 2030-01-07 --dry-run
node index.js list-slots --center 1001
```

## Configuration

Secrets stay in `.env`, while booking behavior lives in `cultbot.config.yaml`. The `default` block is the base profile: it groups centers, preferred clock times (`slots`), an optional interval (`timeRange`), workouts, waitlist behavior, and priority order (`selectionOrder`):

```yaml
version: 1

default:
  centers: [1001, 1002]
  slots: ["07:00", "08:00"]
  timeRange: "06:00-09:00"
  workouts:
    - "YOGA"
    - "DANCE FITNESS"
  enableWaitlist: true
  selectionOrder: [times, centers, workouts]

profiles:
  weekend:
    timeRange: "09:00-12:00"

weekly:
  saturday:
    profile: weekend
  sunday:
    skip: true

dates:
  "2030-01-07":
    skip: true
```

Exact-date rules take precedence over weekday rules, and weekday rules take precedence over `default`. Profiles inherit omitted fields from `default`, while arrays replace inherited arrays. A multiline `CULTBOT_CONFIG_YAML` value supplies the same document in GitHub Actions or another deployment that cannot mount a configuration file.

`CURL_COMMAND` and notification credentials stay in environment secrets. Centers, time preferences, workouts, waitlist behavior, retries, and logging all come from the YAML document, so the booking policy has one source of truth.

## Selection Behavior

`selectionOrder` determines which of the three preference dimensions has priority. The default order, `[times, centers, workouts]`, tries every center and workout at the first preferred time before moving to the next time. A center-first order keeps trying later times at the preferred location before falling back elsewhere. A workout-first order can choose a later favorite class over an earlier fallback.

CultBot supports all six permutations of the three dimensions. Workout names are matched exactly and case-sensitively against discovery output. When waitlisting is enabled, CultBot follows the configured candidate order even when seat availability differs, so a preferred waitlist can be selected before a lower-priority open seat.

## Architecture

The codebase uses small modules, with configuration resolution and schedule selection kept in pure functions that do no network I/O.

| Module              | Responsibility                                              |
| ------------------- | ----------------------------------------------------------- |
| `cli.js`            | Command routing, validation, inspection, and one-off flags  |
| `config.js`         | Loads authentication and notification secrets               |
| `profile-config.js` | Parses, validates, and resolves YAML profiles and rules     |
| `curl-parser.js`    | Extracts auth headers and cookies from a curl command       |
| `api-client.js`     | Cult.fit HTTP client with retries and backoff               |
| `schedule.js`       | Builds ordered times and candidate combinations without I/O |
| `booking.js`        | Resolves a date and orchestrates one booking pass           |
| `discovery.js`      | Lists centers, workout names, and schedule times            |
| `notify.js`         | Sends and tests optional notification channels              |
| `logger.js`         | Provides leveled, timestamped logging                       |

## Deployment

| Option         | Behavior                                                                           |
| -------------- | ---------------------------------------------------------------------------------- |
| GitHub Actions | Scheduled runs require `ENABLE_GITHUB_SCHEDULE=true`; manual runs remain available |
| systemd        | Runs in local time, waits for the network, and catches up missed runs              |
| cron           | Uses the provided one-line schedule and logrotate example                          |
| Docker         | Runs one containerized booking pass from a host or platform scheduler              |

The Raspberry Pi setup helper installs dependencies, creates missing configuration files without overwriting existing ones, restricts `.env` permissions, and can install the systemd units. Only one scheduling path should be enabled for a deployment.

## Challenges

1. Expressing precedence clearly required exact-date rules, weekday rules, named profiles, inheritance, and replacement semantics that remain predictable together.
2. Choosing among several times, centers, and workouts required a configurable traversal order instead of hard-coded nested loops.
3. Keeping cloud and self-hosted schedulers from racing required an explicit opt-in switch for scheduled GitHub runs.
4. Authentication had to reuse a browser session without storing a password or automating the login interface.
5. Retries and notifications had to improve reliability without turning permanent auth failures or broken webhooks into repeated booking attempts.

## Outcomes

- One command handles routines that vary by weekday, exact date, center, time window, and workout
- Configuration can be parsed and resolved offline before credentials or network access are involved
- Booking output and notifications identify the selected center by both name and ID
- The same booking engine runs in GitHub, directly on Linux, or in a container
- Dedicated tests cover profile precedence, strict validation, all six selection orders, time ranges, multi-center fallback, skips, and duplicate-booking prevention
