---
title: "Designing a pluggable trailing stop-loss engine"
description: "How StalkMarket's strategy engine works: a pure-function Strategy interface, a discriminated StrategyResult, paise-precision math, and crash-safe deduplication for the trailing stop-loss."
publishedAt: 2026-05-09
category: Fintech
tags:
  - Trading
  - Strategy
  - TypeScript
  - Algorithms
  - SQLite
  - Testing
author: "Tapan Meena"
draft: false
---

> **Risk disclaimer.** The math and code in this post describe one specific strategy on one specific market. It is not financial advice. Backtest your own rules on your own data; never put real money on a strategy you can't explain in one paragraph.

This is part 2 of the [StalkMarket series](/blog/fintech/stalkmarket-overview). Here I'm going deep on the engine: the piece that actually decides whether to send a notification or stay silent.

## The shape of the problem

A trailing stop-loss is "simple":

- Buy at $P_0$.
- As price climbs to a new high $H$, set the stop at $S = H \times (1 - x/100)$.
- Only ratchet $S$ upward, never down.
- When LTP drops below $S$, fire the exit.

The traps are everywhere:

- A flat percentage is fine for HDFC Bank and terrible for Adani Green.
- A single rogue tick can ratchet the stop to a level the stock won't see again for weeks.
- A power cut mid-notification must not produce duplicate Telegram messages on restart.
- A 3-paise rounding mistake produces stop prices the broker will reject (NSE tick is ₹0.05 for most equities).

A good engine isolates the rule from all of that.

## The interface

The whole strategy contract is one TypeScript file:

```ts
// src/engine/strategy.ts
export interface Strategy {
  readonly name: string;
  evaluate(input: StrategyInput): StrategyResult;
}
```

Pure function. No DB, no IO, no clock, no logger. The same input always produces the same output. That's the entire seam.

Inputs are a snapshot of "what the engine knows right now":

```ts
// src/engine/types.ts
export interface StrategyInput {
  currentPrice: number; // latest LTP
  buyPrice: number; // user's purchase price
  stopLossPct: number; // x — stock override or user global
  marginPct: number; // y — gate before ratchet
  state: StockStateSnapshot | null; // null = first evaluation
}
```

And the output is a discriminated union, which is the part of the design I'd defend hardest:

```ts
export type StrategyResult =
  | { action: "SKIP"; reason: string }
  | { action: "STOP_SET"; stopPrice: number; highestPrice: number }
  | {
      action: "STOP_UPDATED";
      stopPrice: number;
      previousStopPrice: number;
      highestPrice: number;
    }
  | { action: "STOP_HIT"; stopPrice: number; currentPrice: number };
```

Why a discriminated union, instead of returning something like `{ stop, shouldNotify }`?

- The poller `switch`es on `action`, and the compiler enforces that every branch is handled.
- Each variant carries exactly the data its consumer needs. Nothing optional, nothing nullable.
- Adding a new action like `BREAKEVEN_LOCKED` becomes a single TS error in every consumer until each one is updated. The compiler does the migration for you.

## The trailing-stop math

The current implementation lives in `src/engine/strategies/trailing-stop.ts`. The rule is a few lines, but each line has a reason.

**1. Compute the candidate stop from the current price.**

$$
S_\text{candidate} = \text{round}(P \times (1 - x/100), 2)
$$

Note that this derives from the _current_ polled price, not the lifetime high. That's intentional. It makes the engine resilient to outlier ticks, because a single rogue print only affects this one tick's candidate (and even then only if the margin gate also passes).

**2. Don't arm a stop that wouldn't be a profit.**

$$
S_\text{candidate} \le P_0 \quad \Rightarrow \quad \text{SKIP}
$$

If the would-be stop is at or below the buy price, there's no profit to protect. Skip silently.

**3. Margin gate: only ratchet on real moves.**

Once a stop $S$ exists, only update it when the price has cleared a margin threshold above the current stop:

$$
P > S \times (1 + y/100)
$$

Without this gate, every tiny tick triggers a notification. With it, the user only hears from the bot on moves that actually matter.

**4. Stops never decrease.**

$$
S_\text{new} = \max(S, S_\text{candidate})
$$

This is the core invariant. Any code that violates it is a bug. (One subtle way phase-based strategies can regress this is covered in the design notes for the planned breakeven strategy.)

**5. STOP_HIT detection.**

$$
P < S \quad \Rightarrow \quad \text{STOP\_HIT}
$$

LTP dropped below the active stop. The result carries both `stopPrice` and `currentPrice` so the notification can show both ("triggered at ₹X, observed at ₹Y").

**6. Dedupe at the engine boundary.**

Even if the math says `STOP_UPDATED` to ₹103.55, if `state.last_notified_stop_price === 103.55` we return `SKIP`. This is what makes the system safe across restarts; more on it below.

## A worked example

Take HDFC Bank with `buy_price = ₹1500`, `stop_loss_pct = 3%`, `margin_pct = 0.5%`:

| Tick |    LTP | Computed stop | Action           | Reason                                                                                                                      |
| ---: | -----: | ------------: | ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
|    1 | ₹1,500 |        ₹1,455 | SKIP             | stop ≤ buy, no profit yet                                                                                                   |
|    2 | ₹1,550 |     ₹1,503.50 | **STOP_SET**     | first time stop > buy                                                                                                       |
|    3 | ₹1,560 |     ₹1,513.20 | SKIP             | margin gate: 1,560 > 1,503.50 × 1.005 (1,511.02)? yes — but candidate 1,513.20 > current 1,503.50, so actually STOP_UPDATED |
|    4 | ₹1,540 |     ₹1,493.80 | SKIP             | candidate < current stop, no ratchet                                                                                        |
|    5 | ₹1,650 |     ₹1,600.50 | **STOP_UPDATED** | clean ratchet up                                                                                                            |
|    6 | ₹1,599 |             — | **STOP_HIT**     | LTP fell below ₹1,600.50                                                                                                    |

<!-- TODO: insert trailing-stop-sparkline.png (price line + ratcheting stop step, exported via web/src/components/charts/sparkline.tsx) -->

## Crash safety: the dedupe story

This is the part that took the longest to get right.

**Scenario:** the bot evaluates a position, computes a new stop, sends the Telegram notification successfully, and then the Pi loses power _before_ the DB write commits.

On restart:

1. Engine reads `stock_state` — sees the _previous_ stop.
2. Re-evaluates with the same (or near-same) price.
3. Computes the same new stop.
4. Should NOT send another Telegram.

The fix is two columns on `stock_state`:

- `current_stop_price` — what the engine considers active.
- `last_notified_stop_price` — what the user has actually been told.

The engine's last guard before returning `STOP_UPDATED`:

```ts
if (state.last_notified_stop_price === newStopPrice) {
  return { action: "SKIP", reason: "Already notified at this stop" };
}
```

The poller writes `last_notified_stop_price` only after the notification dispatch resolves successfully. Worst case across a power cut: the Telegram was sent, the DB row wasn't updated, and the user gets one duplicate notification. That's acceptable. The reverse, never sending the notification, is not.

There's a parallel concern: "I want to update state but suppress the notification." That's the cooldown path. When a user has a 5-minute cooldown active and the price moves, the engine still wants to track the new high without spamming them. `db/stock-state.ts` exposes a separate `updateStateOnly()` that touches `highest_price` and `current_stop_price` without touching the notification fields. Cooldown-suppressed updates use that path.

`STOP_HIT` always notifies, no cooldown, no dedupe. A stop hit is a one-shot event you cannot afford to miss.

## Paise precision and tick rounding

Stop prices are rounded to 2 decimals (paise). The NSE tick size is mostly ₹0.05, so a value like ₹103.57 would be rejected by the broker as an invalid tick. Today the engine rounds to paise; the next iteration will snap down to the nearest valid tick before any order leaves the system. The rule is simple: the engine should never produce a stop the broker will reject.

## Why pure functions pay off

The engine is the most-tested module in the codebase, and it's also the easiest to test:

```ts
// src/test/engine/strategies/trailing-stop.test.ts (sketch)
it("ratchets stop upward only", () => {
  const r1 = strat.evaluate({
    currentPrice: 1650,
    buyPrice: 1500,
    stopLossPct: 3,
    marginPct: 0.5,
    state: stateAt(1503.5),
  });
  expect(r1).toEqual({
    action: "STOP_UPDATED",
    stopPrice: 1600.5,
    previousStopPrice: 1503.5,
    highestPrice: 1650,
  });

  const r2 = strat.evaluate({
    currentPrice: 1610,
    buyPrice: 1500,
    stopLossPct: 3,
    marginPct: 0.5,
    state: stateAt(1600.5),
  });
  expect(r2.action).toBe("SKIP"); // candidate 1561.7 < current stop
});
```

No mocks, no fixtures, no clock injection. Just inputs and outputs. The poller, broker, notifications, and DB get tested separately, and they need it more, because they're the parts that touch the world.

## What else the interface enables

The whole point of the `Strategy` interface is to grow. The companion `STRATEGIES.md` design doc sketches the next candidates:

| Strategy              | Idea                                                    | Best for                          |
| --------------------- | ------------------------------------------------------- | --------------------------------- |
| Fixed stop            | One stop at entry, never moves                          | Beginners, position-sizing        |
| Breakeven → trail     | Phase 1: hard stop. Phase 2: breakeven. Phase 3: trail. | Earnings-window swing trades      |
| Tiered trail          | Trail % tightens as profit grows                        | Trending large-caps               |
| Profit-target + trail | Hard ceiling + trail beneath                            | Clear price-target setups         |
| Time stop             | Exit if N days old and < min profit                     | Capital efficiency                |
| ATR / Chandelier      | $S = H - \text{ATR}(14) \times m$                       | Volatility-adapted stops          |
| MA stop               | Exit on close below SMA(N)                              | Trend-followers                   |
| Donchian / N-bar low  | Exit on close below lowest low of N sessions            | Pure price-action trend-followers |

Each is a single file implementing `Strategy`. The engine doesn't change. The poller doesn't change. The notification format doesn't change. That's the payoff.

## What I'd do differently

- **Snap to NSE tick size in the engine itself,** not as a downstream order-side concern.
- **Add a confirmation filter for ratchets:** require the new high to hold for at least two polls before promoting `highest_price`. Single-tick spikes are more common than I expected.
- **Per-stock strategy selection.** Today every position uses the same trailing stop. The interface supports per-position swap; the config schema doesn't yet expose it.

## Series

1. [Overview and architecture](/blog/fintech/stalkmarket-overview).
2. **Trailing stop-loss engine.** You're here.
3. [Multi-broker auth: TOTP, OAuth, and token persistence done right](/blog/fintech/stalkmarket-multi-broker-auth).

> One last reminder: this is one mechanical rule, not a profitable system. A trailing stop won't save a bad entry, won't fix poor position sizing, and won't replace your judgement.
