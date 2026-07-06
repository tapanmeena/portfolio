---
title: "CultBot: Auto-Booking My Cult.fit Classes the Moment Slots Open"
description: "How I built CultBot — a Node.js CLI and scheduled GitHub Action that books my preferred Cult.fit class the moment slots open at 10 PM IST, with priority-ordered workouts, waitlist support, retries, and notifications."
publishedAt: 2026-07-06
category: Cli Tools
tags:
  - Node.js
  - CLI
  - Automation
  - GitHub Actions
  - JavaScript
  - Fitness
author: "Tapan Meena"
draft: false
---

## Introduction

Booking a Cult.fit class is a race I kept losing.

Cult.fit opens each day's schedule a few days ahead, at 10 PM sharp — book on Monday night and you're booking for Friday. The catch: the popular morning slots — the 7 AM strength class at my center — fill within _minutes_ of the window opening. Winning meant dropping whatever I was doing at 10 PM, tapping through the same screens, and hoping a seat was still free.

So I stopped playing and wrote a bot instead. **CultBot** reads the schedule, finds my preferred workout at my preferred time and center, and books it — or joins the waitlist if it's full. A scheduled GitHub Action runs it at 10 PM every night — the instant the new day opens — so my morning spot is locked in before it can sell out.

```bash
# The whole thing, once it's configured:
npm run book
```

No passwords stored. No brittle UI automation. Just the same API the app already uses, driven by a small, testable CLI.

---

## How It Works

The flow is deliberately simple:

1. Fetch the current schedule using your account cookies.
2. Pick the target day — by default the newest one that just opened (a few days out).
3. If you already have a booking that day, stop.
4. Walk your preferred time slots in order and, within each slot, pick the highest-priority workout that's available.
5. Book it, or join the waitlist when it's full and waitlisting is on.
6. Optionally notify you with the result.

---

## Authentication Without Storing a Password

The trickiest question with any "book it for me" tool is auth. I didn't want to automate a login flow or store credentials. Cult.fit already authenticates my browser with session cookies, so CultBot just reuses them.

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

The parser is deliberately forgiving — it grabs every `-H`/`--header` and the `-b`/`--cookie` value regardless of order, and falls back to a `cookie:` header when the export doesn't use `-b`.

> The curl command contains your session cookies. Treat it like a password, and never commit your `.env`.

---

## Finding Your Preferences

You need three things: a center, some time slots, and a priority-ordered list of workouts. Rather than make you dig through the app, CultBot has discovery commands that print exactly what the API offers:

```bash
npm run list-centers    # find your PREFERRED_CENTER id
npm run list-workouts   # find exact PREFERRED_WORKOUTS names
npm run list-slots      # find PREFERRED_SLOTS times
```

Each one hits the same schedule endpoint and de-duplicates the results. Then you validate everything at once:

```bash
npm run doctor
```

`doctor` checks your config and confirms authentication actually works — so you find out something's wrong _before_ the nightly 10 PM run, not after.

---

## The Booking Algorithm

The interesting part is choosing _which_ class to book. I kept all of that logic in a `schedule.js` module of **pure functions** — no network calls, no clock, no side effects. That makes the fiddly "walk the schedule and pick a class" logic trivial to reason about and test.

Matching is done on **workout name**, not ID. Cult.fit's numeric workout IDs aren't stable across the catalogue, but the names are — so CultBot lowercases both sides and sorts candidates by their index in your preference list:

```js
export function findMatchingClasses(
  daySchedule,
  { slot, centerId, workouts, enableWaitlist },
) {
  const timeSlot = (daySchedule?.classByTimeList || []).find(
    (item) => item.id === slot,
  );
  if (!timeSlot) return [];

  const center = (timeSlot.centerWiseClasses || []).find(
    (item) => item.centerId === centerId,
  );
  if (!center) return [];

  const wanted = workouts.map((w) => w.toLowerCase());
  const bookable = new Set(
    enableWaitlist ? ["AVAILABLE", "WAITLIST_AVAILABLE"] : ["AVAILABLE"],
  );

  return (center.classes || [])
    .map((cls) => ({
      ...cls,
      preference: wanted.indexOf((cls.workoutName || "").toLowerCase()),
    }))
    .filter((cls) => cls.preference !== -1 && bookable.has(cls.state))
    .sort((a, b) => a.preference - b.preference);
}
```

The orchestration in `booking.js` then walks your slots in order and books the first match. Because `PREFERRED_WORKOUTS` is a list, you get a fallback chain for free — set `HRX WORKOUT,EVOLVE YOGA,DANCE FITNESS` and CultBot tries each in turn:

```js
for (const slot of preferences.slots) {
  const matches = findMatchingClasses(daySchedule, {
    slot,
    centerId,
    workouts: preferences.workouts,
    enableWaitlist: preferences.enableWaitlist,
  });
  if (matches.length === 0) continue;

  const target = matches[0];
  const isWaitlist = target.state === "WAITLIST_AVAILABLE";

  if (dryRun) {
    return finish({
      status: "dry-run",
      message: `[DRY RUN] Would ${isWaitlist ? "join waitlist for" : "book"} "${target.workoutName}" at ${slot}.`,
    });
  }

  await apiClient.bookClass(target.id);
  return finish({
    status: isWaitlist ? "waitlisted" : "booked",
    message: `${isWaitlist ? "Joined waitlist for" : "Booked"} "${target.workoutName}" at ${slot}.`,
  });
}
```

That `dryRun` branch is one of my favorite parts — `npm run preview` runs the exact same decision logic and tells you what _would_ happen, without touching your booking.

---

## Retries That Know When to Give Up

The 10 PM booking window is exactly when the API is busiest, so transient failures are expected. The HTTP client retries with exponential backoff — but only for failures worth retrying:

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

## Automating It with GitHub Actions

The CLI is nice, but the goal was to _never think about it again_. A scheduled workflow handles that:

```yaml
on:
  schedule:
    - cron: "31 16 * * *" # 22:01 IST — a minute after slots open at 10 PM
  workflow_dispatch:
    inputs:
      dry_run:
        description: "Preview only (do not actually book)"
        type: boolean
        default: false
```

Auth goes in an encrypted `CURL_COMMAND` secret; preferences go in repository variables so I can tweak them without editing code:

```yaml
env:
  CURL_COMMAND: ${{ secrets.CURL_COMMAND }}
  PREFERRED_CENTER: ${{ vars.PREFERRED_CENTER }}
  PREFERRED_SLOTS: ${{ vars.PREFERRED_SLOTS }}
  PREFERRED_WORKOUTS: ${{ vars.PREFERRED_WORKOUTS }}
  ENABLE_WAITLIST: ${{ vars.ENABLE_WAITLIST }}
```

> GitHub schedules run in UTC and can start a few minutes late under load. I set the cron slightly _before_ the target and let the retry logic close the gap.

The `workflow_dispatch` input means I can trigger a dry run from the Actions tab any time I want to sanity-check my config.

---

## Notifications

A booking that fires automatically at 10 PM while I'm not watching is a booking you don't trust yet. CultBot can post the result to Discord, Slack, Telegram, or a generic webhook — and every notification failure is swallowed, because a broken webhook must never break a booking:

```js
async function notify(message) {
  if (targets.length === 0) return;
  await Promise.all(
    targets.map(async (target) => {
      try {
        await fetch(target.url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(target.payload(message)),
        });
      } catch (error) {
        logger.warn(
          `Failed to send ${target.name} notification: ${error.message}`,
        );
      }
    }),
  );
}
```

---

## What I Learned

1. **Pure functions are a cheat code for tricky logic.** Keeping all the schedule-walking in side-effect-free functions meant I could reason about (and test) the "which class?" decision without mocking a single network call.
2. **Reuse the session you already have.** Parsing a curl command sidesteps an entire category of login-automation pain — and keeps credentials out of the code.
3. **Retry _selectively_.** Backing off on `429`/`5xx` while failing fast on `401` made the bot both resilient and honest about what it can't fix.
4. **Cron drift is real.** UTC scheduling plus a few minutes of GitHub Actions latency meant timing had to be a head start plus retries, not a precise alarm.

---

## Try It Out

If you're tired of racing the 10 PM booking window every night, CultBot might save you the scramble. It's a small Node.js project — clone it, paste your curl command, set three preferences, and let a scheduled action do the rest.

📦 [View CultBot on GitHub](https://github.com/tapanmeena/CultBot)

> CultBot automates your own Cult.fit account for personal convenience. Use it responsibly and in line with the Cult.fit terms of service, and keep your credentials private.
