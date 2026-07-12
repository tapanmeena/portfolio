---
title: "CultBot: Auto-Booking My Cult.fit Classes the Moment Slots Open"
description: "How I built a YAML-driven Node.js CLI that books Cult.fit classes with date-based profiles, priority rules, notifications, retries, and flexible scheduling."
publishedAt: 2026-07-06
updatedAt: 2026-07-12
category: Cli Tools
tags:
  - Node.js
  - CLI
  - Automation
  - GitHub Actions
  - JavaScript
  - Fitness
  - YAML
  - Docker
  - Raspberry Pi
author: "Tapan Meena"
draft: false
---

## Introduction

Booking a Cult.fit class is a race I kept losing.

Cult.fit opens each day's schedule a few days ahead at 10 PM sharp. Book on Monday night and you are booking for Friday. Popular morning slots, especially the 7 AM strength class at my center, fill within minutes. Winning meant dropping whatever I was doing at 10 PM, tapping through the same screens, and hoping an open seat remained.

So I built **CultBot**, a Node.js CLI that reads the live schedule and books the best class for a configured routine. It can compare several times, centers, and workouts, book an open seat, or join a waitlist when the preferred class is full.

A real routine is more than one center and a fixed list of times. Weekends may need later classes, some weekdays may use a different center, and holidays may need explicit skips. CultBot expresses those choices in a versioned YAML configuration, where a profile groups the preferences for one routine and date or weekday rules choose which profile applies. The booking engine stays independent from the scheduler that starts it.

```bash
# The whole booking pass, once it is configured
npm run book
```

There are no passwords or brittle UI automation scripts. CultBot reuses an existing browser session, resolves the profile for the class date, evaluates time, center, and workout priorities, then exits after one booking pass. GitHub Actions, systemd, cron, or Docker can start that same command on a schedule.

📦 [View CultBot on GitHub](https://github.com/tapanmeena/CultBot)

---

## How It Works

Each booking pass follows the same explicit steps:

1. Fetch the current schedule using your account cookies.
2. Select the first, last, or a specific date exposed by the live schedule.
3. Resolve an exact-date rule, a weekday rule, or the default profile, in that order.
4. Stop when the date is configured as a rest day or already has a booking at any center.
5. Build candidate times from preferred clock times (`slots`), a flexible interval (`timeRange`), or both.
6. Walk every time, center, and workout combination in the configured priority order.
7. Book the first permitted class, or join its waitlist when waitlisting is enabled.
8. Log and optionally notify the result with the center name and ID.

---

## Authentication Without Storing a Password

The trickiest question with any "book it for me" tool is authentication. I didn't want to automate a login flow or store credentials. Cult.fit already authenticates my browser with session cookies, so CultBot reuses them.

You open DevTools, right-click any request to `cult.fit`, choose **Copy as cURL**, and paste the whole command into `.env` as `CURL_COMMAND`. A small parser pulls out exactly the headers and cookies the API needs:

```js
const HEADER_FLAG = /(?:-H|--header)\s+(['"])(.*?)\1/gs;
const COOKIE_FLAG = /(?:-b|--cookie)\s+(['"])(.*?)\1/s;

export function parseCurl(curlString) {
  const headers = {};
  let match;
  while ((match = HEADER_FLAG.exec(curlString)) !== null) {
    const raw = match[2];
    const separator = raw.indexOf(":");
    if (separator === -1) continue;
    headers[raw.slice(0, separator).trim().toLowerCase()] = raw
      .slice(separator + 1)
      .trim();
  }

  let cookies = "";
  const cookieMatch = COOKIE_FLAG.exec(curlString);
  if (cookieMatch) cookies = cookieMatch[2].trim();
  // Some exports put cookies in a `cookie:` header instead of using -b.
  if (!cookies && headers.cookie) cookies = headers.cookie;

  return { headers, cookies };
}
```

The parser is deliberately forgiving. It grabs every `-H`/`--header` and the `-b`/`--cookie` value regardless of order, and falls back to a `cookie:` header when the export doesn't use `-b`.

> The curl command contains your session cookies. Treat it like a password, and never commit your `.env`.

---

## Defining Booking Policy in YAML

CultBot keeps credentials and notification endpoints in `.env`, while non-secret booking policy lives in `cultbot.config.yaml`. This separates sensitive values from the routine you may want to review, version, and change frequently:

```bash
cp .env.example .env
cp cultbot.config.example.yaml cultbot.config.yaml
```

A minimal configuration uses a `default` profile, which supplies the base centers, preferred clock times (`slots`), optional time interval (`timeRange`), workouts, waitlist behavior, and preference order (`selectionOrder`):

```yaml
version: 1

default:
  centers: [1001, 1002]
  slots: ["07:00", "08:00"]
  timeRange: "06:00-09:00"
  workouts:
    - "HRX WORKOUT"
    - "EVOLVE YOGA"
  enableWaitlist: true
  selectionOrder: [times, centers, workouts]
```

The configuration can also define named profiles for alternate routines, map weekdays to profiles, add exact-date exceptions, and mark rest days:

```yaml
profiles:
  weekend:
    timeRange: "09:00-12:00"
    workouts:
      - "DANCE FITNESS"
      - "EVOLVE YOGA"

weekly:
  saturday:
    profile: weekend
  sunday:
    skip: true

dates:
  "2030-01-06":
    profile: default
  "2030-01-07":
    skip: true
```

Resolution is deterministic. An exact-date rule takes precedence over its weekday rule, and a weekday rule takes precedence over `default`. Omitted profile fields inherit from `default`, while arrays replace inherited arrays instead of being appended. That lets a date switch centers or times without repeating the entire routine.

For GitHub Actions and other environments that cannot mount a file, `CULTBOT_CONFIG_YAML` accepts the same complete document and takes precedence over the local file. `CURL_COMMAND` and notification credentials stay in environment secrets; all booking behavior comes from YAML.

## Discovering and Validating Preferences

Discovery commands read the live schedule and print the values needed by the YAML configuration:

```bash
npm run list-centers
npm run list-workouts
npm run list-slots
node index.js list-slots --center 1001
```

Validation is split into progressively stronger checks:

```bash
npm run config:validate
node index.js config show --date 2030-01-07
npm run doctor
npm run preview
```

`config:validate` parses YAML without credentials or network access. `config show` resolves a representative date and reports whether it came from `default`, a weekday rule, or an exact date. `doctor` then confirms authentication and live schedule access. Finally, `preview` runs the real selection path without sending a booking request.

The parser rejects unknown fields, duplicate keys, invalid dates and times, unsupported selection orders, multiple documents, aliases, merge keys, and explicit YAML tags. Configuration mistakes fail before a scheduled run reaches the booking API.

---

## A Three-Dimensional Booking Algorithm

Choosing one class requires comparing three independent priority dimensions: times, centers, and workouts. `selectionOrder` decides which dimension is most important, and a recursive generator yields each exact candidate in that order:

```js
export function* iterateCandidates(preferences, times) {
  const dimensions = {
    times,
    centers: preferences.centers,
    workouts: preferences.workouts,
  };
  const selected = {};

  function* walk(depth) {
    if (depth === preferences.selectionOrder.length) {
      yield {
        slot: selected.times,
        centerId: selected.centers,
        workout: selected.workouts,
      };
      return;
    }

    const dimension = preferences.selectionOrder[depth];
    for (const value of dimensions[dimension]) {
      selected[dimension] = value;
      yield* walk(depth + 1);
    }
  }

  yield* walk(0);
}
```

The default `[times, centers, workouts]` exhausts every center and workout at the first preferred time before trying the next time. `[centers, times, workouts]` stays at the first center and tries all its times before falling back to another location. All six permutations are supported and covered by tests.

Exact `slots` and a flexible `timeRange` can be combined. CultBot tries explicit slots first, adds other live schedule times inside the range in chronological order, and removes duplicates. This keeps favorite times at the front while adapting when Cult.fit adds or moves a class.

CultBot matches workouts by exact, case-sensitive name because catalogue IDs are not stable. The discovery command is the source of truth, so its output should be copied into YAML as shown.

Waitlisting follows the configured candidate order. When it is enabled, a waitlist at a higher-priority combination wins before an open seat at a lower-priority combination. Disable waitlisting when any confirmed seat should beat a preferred waitlist.

`npm run preview` uses this same candidate generator and reports the selected workout, date, center name, and center ID without changing the booking.

---

## Retries That Know When to Give Up

The 10 PM booking window is exactly when the API is busiest, so transient failures are expected. The HTTP client uses exponential backoff, increasing the delay after each failed request, but only retries failures worth retrying:

```js
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

// ...inside the request loop:
if (!response.ok) {
  const error = new Error(`HTTP ${response.status} ${response.statusText}`);
  error.status = response.status;
  // Non-retryable responses (401/403/404) should fail fast.
  if (!RETRYABLE_STATUS.has(response.status) || attempt > maxRetries) {
    error.fatal = true;
  }
  throw error;
}
```

A `429` or `503` gets backed off and retried; a `401` (expired session) fails immediately with a clear message telling you to refresh your curl command. There's no point retrying a request that will never succeed.

---

## Running It Where It Makes Sense

CultBot is a one-shot command. It books or skips, reports the result, and exits, so the scheduler is a deployment choice rather than part of the booking engine.

### GitHub Actions

The repository includes a scheduled workflow and a manual dry-run input that exercises selection without sending a booking request. Scheduled runs are opt-in, which prevents GitHub Actions from competing with a self-hosted scheduler:

```yaml
jobs:
  book:
    if: github.event_name != 'schedule' || vars.ENABLE_GITHUB_SCHEDULE == 'true'
    env:
      CURL_COMMAND: ${{ secrets.CURL_COMMAND }}
      CULTBOT_CONFIG_YAML: ${{ vars.CULTBOT_CONFIG_YAML }}
```

Set `ENABLE_GITHUB_SCHEDULE=true` only when GitHub should own the nightly run. Manual `workflow_dispatch` runs remain available when the schedule is off. GitHub cron uses UTC and may start late under load, so the workflow time should be adjusted for the booking window.

### Raspberry Pi or Linux Server

The setup helper checks Node.js and pnpm, installs dependencies, creates local configuration files without replacing existing ones, locks `.env` to mode `600`, and can install a systemd timer:

```bash
./scripts/setup-pi.sh --with-systemd
```

The service waits for `network-online.target`, runs one booking pass, and has a five-minute ceiling. Its timer uses the host's local time and `Persistent=true`, so a run missed during downtime starts after the machine returns. A cron example and logrotate configuration are included for simpler installations.

### Docker

The Docker image uses the same one-shot model. Secrets come from `.env`, while the YAML file is mounted read-only:

```bash
docker compose build
docker compose run --rm cultbot
docker compose run --rm cultbot book --dry-run
```

Host cron, systemd, or a container platform can schedule that command. Only one scheduler should be enabled for an installation.

---

## Notifications

A booking that runs while I am not watching needs an independent result. CultBot can post to Discord, Slack, Telegram, or a generic webhook. Each channel returns its own delivery result, and a failed webhook never changes a successful booking into a failed one:

```js
async function send(target, message) {
  try {
    const response = await fetch(target.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(target.payload(message)),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { name: target.name, ok: true };
  } catch (error) {
    logger.warn(`Failed to send ${target.name}: ${error.message}`);
    return { name: target.name, ok: false, error: error.message };
  }
}
```

Notifications can also be tested without Cult.fit credentials:

```bash
npm run test-notify
```

The command reports delivery for each configured channel, which is much better than discovering a bad webhook after the first unattended run.

---

## What I Learned

1. Configuration becomes a domain model sooner than expected. Once behavior varies by weekday, date, location, and time, a validated document is clearer than a growing collection of environment variables.
2. Priority needs to be explicit across dimensions. A flat workout list could not express whether time, center, or workout mattered most, while `selectionOrder` can.
3. Pure functions keep combinatorial logic manageable. Profile resolution, candidate generation, time-range expansion, and schedule matching can all be tested without network calls.
4. Scheduling and booking are separate responsibilities. The same one-shot command works with GitHub Actions, systemd, cron, Docker, or a future scheduler without changing booking logic.
5. Operational checks deserve first-class commands. Offline validation, date resolution, live auth checks, previews, and notification tests catch different failures at the cheapest useful stage.

---

## Try It Out

After cloning the repository, separate secrets from policy, validate one representative date, and preview the real selection:

```bash
pnpm install
cp .env.example .env
cp cultbot.config.example.yaml cultbot.config.yaml
npm run config:validate
npm run doctor
npm run preview
```

After the preview picks the right class, run `npm run book` directly or enable exactly one scheduler. The [configuration guide](https://github.com/tapanmeena/CultBot/blob/main/docs/configuration-guide.md) covers inheritance, every selection order, flexible time ranges, and deployment-specific configuration.

📦 [View CultBot on GitHub](https://github.com/tapanmeena/CultBot)

> CultBot automates your own Cult.fit account for personal convenience. Use it responsibly and in line with the Cult.fit terms of service. Keep your session cookies and notification credentials private.
