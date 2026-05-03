---
title: "Strategy Foundations"
description: "A strategy is a repeatable set of rules with a positive expected value over many trades. Not a single tip, not a hunch."
tier: beginner
order: 7
source: "../TradingBot/docs/learn/07-strategies.md"
---
# 7. Strategy Foundations

A **strategy** is a repeatable set of rules with a positive expected value over many trades. Not a single tip, not a hunch.

## What makes a strategy?

Every strategy must define:

1. **Universe** — which stocks/instruments you'll trade (e.g., Nifty 100, F&O list).
2. **Setup** — exact conditions to look for (the "screen").
3. **Entry trigger** — what fires the order (e.g., break of high).
4. **Stop loss** — where the thesis is invalidated.
5. **Target / exit** — where you take profit (or how you trail).
6. **Position sizing** — derived from risk (see [Chapter 6](06-risk-management.md)).
7. **Time stop** — exit if nothing happens within X bars/days.

If any one is missing, you don't have a strategy — you have a guess.

---

## The three foundational styles

### 1. Trend Following

> "Buy high, sell higher."

**Idea:** Once a trend starts, it tends to continue. Ride it.

- **Entry:** Pullback to a moving average in an uptrend, or breakout from consolidation.
- **Tools:** EMAs, Supertrend, ADX (>25), higher highs / higher lows.
- **Exit:** Trailing stop (this is the bread and butter of StalkMarket).
- **Win rate:** Lower (~35–45%), but **big winners pay for many small losers**.
- **Best in:** Trending markets. Gets chopped up in ranges.

**Classic setup — "EMA pullback long":**
1. Daily chart, price above 50 EMA, ADX > 20.
2. Wait for price to dip to the 20 EMA.
3. Entry: bullish reversal candle (hammer, engulfing).
4. SL: below the swing low.
5. Trail with 20 EMA or Supertrend.

### 2. Mean Reversion

> "What goes up must come down (a little)."

**Idea:** Price stretches too far from its mean and snaps back.

- **Entry:** Oversold in an uptrend, overbought in a downtrend.
- **Tools:** RSI (<30 / >70), Bollinger Band touches, distance from VWAP.
- **Exit:** Return to the mean (e.g., 20 SMA, VWAP) or fixed target.
- **Win rate:** High (~60–70%), **but small wins, occasional big losses if you trade against a strong trend.**
- **Best in:** Range-bound markets, large-cap blue chips.

**Classic setup — "RSI oversold bounce":**
1. Stock in clear uptrend on weekly (price > 50 weekly EMA).
2. On daily, RSI dips below 30.
3. Entry: next day's open after a green candle.
4. SL: below recent low.
5. Target: 20 SMA.

### 3. Breakout

> "Trade the move when energy releases."

**Idea:** Price compresses (consolidation, triangle, range), then explodes when one side gives up.

- **Entry:** Break above resistance / below support, **with volume confirmation**.
- **Tools:** Donchian channels (20-day high), Bollinger squeeze, volume spike.
- **Exit:** Measured move (height of the pattern projected), or trailing stop.
- **Win rate:** Medium (~45–55%), but breakouts often run hard.
- **Beware:** **Fakeouts** — false breakouts that immediately reverse. Volume is the filter.

**Classic setup — "20-day high breakout":**
1. Stock makes a new 20-day high.
2. Volume > 1.5× the 20-day average volume.
3. Entry: at the breakout (or 5-min close above).
4. SL: below the prior consolidation high (now support).
5. Trail with 10 EMA or chandelier exit.

---

## Backtesting & paper trading

**Don't trade real money on an idea until you've:**

1. **Backtested** it on at least 2–3 years of data (different market regimes — bull, bear, sideways).
2. **Paper traded** it live for ≥ 30 trades.
3. Confirmed the **expected value** is positive after costs.

### Expected value (EV) per trade

$$ EV = (\text{Win Rate} \times \text{Avg Win}) - (\text{Loss Rate} \times \text{Avg Loss}) $$

If EV ≤ 0 after brokerage, STT, GST, slippage — your strategy is broken.

### Costs add up
A typical Indian intraday trade costs ~0.05–0.1% round-trip in charges. Over 200 trades a year that's 10–20% of capital eaten in fees alone. Choose a discount broker, trade selectively.

---

## Common strategy archetypes (further reading)

| Archetype | Holding | Style |
|-----------|---------|-------|
| Scalping | seconds–minutes | Tiny edges, high frequency |
| Intraday momentum | minutes–hours | News + breakout |
| Opening Range Breakout (ORB) | intraday | Trade the break of first 15-min range |
| Swing trading | days–weeks | Daily charts, trend/breakout |
| Positional | weeks–months | Weekly charts, fundamental tailwind |
| Pairs trading | varies | Long/short correlated stocks |
| Event-driven | varies | Earnings, mergers, results |

---

## The mantras

1. **One setup, mastered, beats ten setups, dabbled in.**
2. **Edge × discipline × time = wealth.** Miss any factor → no compounding.
3. **The market pays you for waiting.** No setup → no trade. Cash *is* a position.
4. **Process over outcome.** Bad trades can win, good trades can lose. Judge yourself by adherence to the plan, not by P&L on a single trade.
