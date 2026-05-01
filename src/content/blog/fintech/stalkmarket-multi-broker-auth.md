---
title: "Multi-broker auth: TOTP, OAuth, and token persistence done right"
description: "How StalkMarket abstracts four Indian broker APIs (Angel One, Upstox, Zerodha, Groww) behind one provider interface — with TOTP, OAuth token injection, persisted tokens, proactive refresh, and a 401 retry path."
publishedAt: 2026-05-16
category: Fintech
tags:
  - Trading
  - Brokers
  - Auth
  - OAuth
  - TOTP
  - Node.js
  - SQLite
author: "Tapan Meena"
draft: false
---

> **Risk disclaimer.** This post is about authentication plumbing, not trading advice. Treat broker credentials with the same paranoia you'd treat your bank password. Anything you build using these patterns is your responsibility.

This is part 3 of the [StalkMarket series](/blog/fintech/stalkmarket-overview). Here I want to walk through the least glamorous but most fragile part of the system: keeping four different broker APIs authenticated, all day, every day, without manual intervention.

## The brief

StalkMarket needs to fetch LTPs and (optionally) place orders against any of:

| Broker                   | Auth model                                                          |
| ------------------------ | ------------------------------------------------------------------- |
| **Angel One** SmartAPI   | Username + password + TOTP → JWT (~24h)                             |
| **Upstox**               | OAuth 2.0 → access token (manually injected after redirect)         |
| **Zerodha** Kite Connect | OAuth-ish: request_token → access_token (expires 6 AM IST next day) |
| **Groww**                | API key based                                                       |

Different flows, different lifetimes, different failure modes, different rate limits. The runtime needs to:

- Re-authenticate without human intervention whenever possible.
- Survive a Pi reboot without re-prompting.
- Never hammer a broker with concurrent re-login attempts.
- Cleanly retry exactly once on a 401.
- Use one broker for LTPs and a different one for orders if the user wants.

## The provider interface

Every broker implements the same minimal contract:

```ts
// src/broker/types.ts (sketch)
export interface BrokerProvider {
  readonly name: BrokerName;
  authenticate(): Promise<AuthTokens>;
  refresh(tokens: AuthTokens): Promise<AuthTokens>;
  getLTP(req: LTPRequest): Promise<LTPResult>;
}
```

Each provider is a self-contained file: `angel-one.ts`, `upstox.ts`, `zerodha.ts`, `groww.ts`. They know nothing about the DB, the mutex, the retry policy, or each other. They take credentials in, and hand back tokens or LTPs.

The orchestration sits in `broker/manager.ts`.

## Per-broker auth flows

### Angel One: fully automated via TOTP

Angel One supports a username, password, and TOTP login that returns a JWT and refresh token. The password isn't stored in plaintext at runtime. Instead, `app.json` carries the TOTP secret (the same one Angel One showed you when you set up 2FA), and `broker/totp.ts` generates the 6-digit code on demand using `otpauth`:

```ts
import { TOTP } from "otpauth";
const totp = new TOTP({ secret, digits: 6, period: 30 });
const code = totp.generate();
```

That code goes into `POST /rest/auth/angelbroking/user/v1/loginByPassword`, which returns `jwtToken`, `refreshToken`, and `feedToken`. From then on, `generateTokens` extends the session using the refresh token, no TOTP required.

The whole login takes about 600 ms. It runs on first start, on token expiry, and on any 401, but not on every poll.

### Upstox: OAuth with one-time manual injection

Upstox uses OAuth 2.0 with a redirect-based authorization code flow. There's no headless way to do this without a browser, and that's fine since it only needs to happen once a day.

The flow is:

1. User clicks "Connect Upstox" in the admin web dashboard.
2. They land on Upstox's auth page, log in, and approve.
3. Upstox redirects back with `?code=...`.
4. The dashboard `POST`s the code to `POST /api/broker/token`.
5. The server exchanges the code for an access token and stores it.

After that, the access token is just another row in `auth_tokens`, used like any other.

### Zerodha (Kite Connect): request-token exchange

Zerodha's flow is similar in shape (manual login, redirect, request_token) with two quirks:

- The exchange endpoint takes `request_token` plus a SHA-256 checksum of `api_key + request_token + api_secret`.
- The access token expires at exactly 6 AM IST the next morning, regardless of when you generated it.

The fixed-expiry quirk is the interesting bit. We compute the absolute `expires_at` once and store it. The proactive refresh logic doesn't need to know about it specifically; it just sees a token expiring soon and acts accordingly. In Zerodha's case, the proactive refresh fails by design, and that surfaces an admin notification telling the user to re-auth via the dashboard.

### Groww: API key

Groww is the simplest of the four: a long-lived API key. No refresh, no expiry, no song and dance. The provider mostly just adds the key to outbound headers.

## The manager: where the interesting work happens

`broker/manager.ts` is the orchestrator. It does five things, roughly in order of importance:

### 1. Persist tokens to SQLite

```sql
CREATE TABLE auth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  broker TEXT NOT NULL,
  jwt_token TEXT NOT NULL,
  refresh_token TEXT,
  feed_token TEXT,
  expires_at TEXT NOT NULL
);
```

On startup, the manager reads any non-expired tokens for the configured broker and uses them directly. No login, no TOTP, no human in the loop, just LTP fetching from second one. This single table is the entire reason a `docker restart` doesn't trigger a fresh login storm.

### 2. Mutex-protected authentication

If the engine fires three polls in parallel and they all simultaneously hit a 401, they shouldn't all separately try to log in. The manager wraps `authenticate()` in a promise-based mutex (`promise-limit`):

```ts
let authInFlight: Promise<AuthTokens> | null = null;

async function authenticateOnce(): Promise<AuthTokens> {
  if (authInFlight) return authInFlight; // coalesce
  authInFlight = doAuthenticate().finally(() => {
    authInFlight = null;
  });
  return authInFlight;
}
```

Anyone calling `authenticate()` while one is in flight rides on the same promise. That eliminates a whole class of "concurrent re-login → broker rate limits us → admin gets paged" bugs.

### 3. Proactive refresh

A scheduled check (run inside the poller, no separate timer) inspects the active token:

- If `expires_at` is more than 30 minutes away, no-op.
- If within the 30-minute buffer, call `refresh()` now, while the token still works.
- If already expired, fall through to the reactive path.

The 30-minute buffer is the sweet spot: long enough that refresh never races with expiry, short enough that we rarely refresh tokens we won't use again.

### 4. Reactive 401 retry

For broker errors that look like auth failures, `getLTP()` does exactly one retry:

```ts
try {
  return await provider.getLTP(req);
} catch (err) {
  if (isAuthError(err)) {
    await authenticateOnce(); // mutex-coalesced
    return await provider.getLTP(req); // try once more
  }
  throw err;
}
```

One retry, then propagate. Two retries is how you build infinite loops.

### 5. Admin notification on persistent failure

If `authenticateOnce()` throws (TOTP secret revoked, broker down, OAuth token expired and no human around to re-auth), the error path notifies the admin Telegram channel with the broker name and error message. The poller keeps going. Other users on other brokers shouldn't be punished for one broken integration.

## Splitting LTP and orders

One nice side effect of the provider abstraction: the LTP broker and the order broker don't have to be the same one.

In my own setup, I use Angel One for LTPs (cheap, headless, TOTP makes it fully automated) and Zerodha for orders (where my actual money lives). Two `auth_tokens` rows, two providers, one engine. The order manager (`orders/manager.ts`) is structurally identical to the broker manager — same mutex, same persistence, same retry — just with a different provider interface (`OrderProvider` instead of `BrokerProvider`).

## Order safety: a brief tangent

Since this post is about brokers, a few safety rails worth calling out:

- **Auto-execution is off by default.** `auto_place_on_stop_hit: false` in the shipped config. You opt in.
- **Dry-run is on by default.** Even when auto-execution is on, the order manager logs the order to `order_executions` without sending it to the broker until you flip dry-run off.
- **Dedupe is durable.** Every attempt — successful, dry-run, failed-retryable, failed-permanent — is a row in `order_executions`. STOP_HITs check this table before placing. A power cut between "STOP_HIT detected" and "order placed" can never produce a duplicate order on restart.

Dry-run by default plus opt-in auto-execution plus durable dedupe means I can leave real-money auto-execution off while I'm still building trust in the engine, and flip it on a stock at a time as that trust grows.

## NSE-aware market hours

The poller doesn't run when the market is closed. That saves API quota, saves log noise, and saves the bot from sending "no change" notifications nobody asked for. `engine/market-hours.ts` combines:

- Day of week (skip Saturday and Sunday).
- Time window (09:15–15:30 IST).
- The NSE holiday calendar fetched from Upstox's public holidays endpoint, cached in memory for 24 hours, and pre-fetched on startup.

The same calendar powers `GET /api/holidays?limit=10` for the dashboard. One source, many consumers.

## Lessons learned

A few things only become obvious after running this for a while:

1. **Rate limits are almost never documented, but they're real.** Polling every 60 seconds with deduplicated symbols across users has been comfortably safe across all four brokers. Polling every 5 seconds, less so.
2. **OAuth tokens that expire at fixed wall-clock times** (Zerodha's 6 AM IST) need a different mental model than "tokens that expire N hours after issue." Always store absolute `expires_at`.
3. **Persisted tokens are not optional** for a Pi-deployed bot. Power cuts happen; the bot has to be resumable in seconds, not minutes.
4. **One coalesced mutex** beats per-request locks. Concurrent re-auths are the silent killer of broker integrations.
5. **Test the auth path end-to-end with stale tokens.** The unit tests for `manager.ts` cover token-restore, expired-token-refresh, 401 retry, and concurrent-auth coalescing, and every one of those scenarios caught a real bug at some point.

## Wrap-up

This series walked through StalkMarket from three angles:

1. [Overview and architecture](/blog/fintech/stalkmarket-overview): the why and the shape.
2. [Trailing stop-loss engine](/blog/fintech/stalkmarket-trailing-stop-strategy): the math and the dedupe.
3. **Multi-broker auth.** You're here.

If there's a recurring theme across all three, it's that the boring infrastructure decisions (pure-function strategy, persisted tokens, durable dedupe, dry-run by default) are what let the interesting parts stay simple. A trading bot is mostly an exercise in not shooting yourself in the foot.

> One last reminder: trading involves real risk. None of this is financial advice. Test on paper, keep auto-execution off until you trust the strategy, and never run code against a live account that you haven't fully read and understood.
