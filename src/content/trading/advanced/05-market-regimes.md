---
title: "Market Regimes"
description: "\"The market regime is the operating environment for your strategies. Use the wrong tool in the wrong regime, and even great execution loses money.\""
tier: advanced
order: 5
source: "../TradingBot/docs/advanced/05-market-regimes.md"
---
# 5. Market Regimes

> "The market regime is the operating environment for your strategies. Use the wrong tool in the wrong regime, and even great execution loses money."

A regime is a **persistent state** of the market with characteristic statistical properties. Regimes change. Strategies that excel in one usually fail in another.

## The four basic regimes

| Regime | Characteristic | Best strategies | Worst strategies |
|--------|---------------|-----------------|------------------|
| **Bullish trend** | Higher highs, low vol, narrow drawdowns | Momentum, breakout, trend-following | Mean reversion, short selling |
| **Bearish trend** | Lower lows, rising vol | Short momentum, vol buying | Buying dips, naked shorts of vol |
| **Quiet range** | Low vol, sideways | Mean reversion, premium selling, condors | Breakout, momentum |
| **Crisis / High vol** | Vol spike, correlations → 1, gaps | Cash, tail hedges, gamma scalping | Most everything else |

## Detecting the regime

### Trend filters
- **Price vs 200-day MA** — above = bullish regime; below = bearish.
- **Slope of 200 SMA** — rising/falling reinforces.
- **% of stocks above 200 SMA** (breadth) — > 70% = strong bull, < 30% = bear.

### Volatility filters
- **VIX level** — low (<15) → quiet, normal/high → trending or stress.
- **VIX percentile** (1-year) — relative measure, more useful than absolute.
- **Realized vol clusters** — GARCH or simple rolling std.

### Trend strength
- **ADX > 25** → trending regime (any direction).
- **ADX < 20** → range / consolidation regime.

### Breadth & participation
- **Advance-decline ratio.**
- **% of stocks at 52-week high vs low.**
- **Sector rotation patterns.**

### Combined regime classifier (example)

```
if Nifty > 200 SMA and slope_pos and VIX_pct < 60:
    regime = "BULL_TREND"
elif Nifty < 200 SMA and VIX_pct > 50:
    regime = "BEAR_TREND"
elif ADX < 20 and VIX_pct < 40:
    regime = "QUIET_RANGE"
elif VIX_pct > 80:
    regime = "CRISIS"
else:
    regime = "TRANSITION"
```

## Why this matters — the strategy/regime fit

| Strategy | Bull trend | Bear trend | Quiet range | Crisis |
|----------|-----------|-----------|-------------|--------|
| 50-day momentum | ⭐⭐⭐ | ⭐⭐ (short) | ❌ | ❌ |
| Breakout | ⭐⭐⭐ | ⭐⭐ | ❌ | ⚠️ (real or fakeout?) |
| Mean reversion (RSI fade) | ⚠️ | ❌ | ⭐⭐⭐ | ❌ |
| Short premium (condor) | ⭐⭐ | ⚠️ | ⭐⭐⭐ | 💀 (existential risk) |
| Long vol (straddles) | ⚠️ | ⚠️ | ❌ | ⭐⭐⭐ |
| Pairs / stat arb | ⭐⭐ | ⚠️ | ⭐⭐⭐ | ❌ (correlations break) |
| Long index + cash | ⭐⭐⭐ | ❌ | ⭐ | ❌ |

> **Most retail blow-ups happen because a strategy that worked for 18 months in a quiet bull suddenly faces a regime change** — and the trader keeps doing the same thing. Recognize the change, switch strategies (or step back).

## Regime change signals

Things that often precede transitions:

- **Volatility expansion** out of a long compression (BB squeeze on Nifty itself).
- **Breadth divergence** — index keeps rising but fewer stocks participate.
- **Defensive sector outperformance** mid-bull (FMCG, Pharma leading) → late-cycle.
- **Yield curve inversion** (10y − 2y < 0) — historically a recession signal 6–12 months out.
- **Skew steepening** — institutions hedging.
- **Credit spreads widening** — risk-off arriving in bond market first.

## Adaptive systems

Two approaches:

### 1. Switching system
Maintain N strategies. Each day, deploy only the one(s) suited to the current regime.

```
if regime == "BULL_TREND":
    deploy: momentum_breakout, pullback_long
elif regime == "QUIET_RANGE":
    deploy: rsi_mean_reversion, iron_condor
elif regime == "CRISIS":
    deploy: cash_only, tail_hedges
```

Pros: clean attribution, simple risk controls.
Cons: regime detection is lagging — you switch after the regime has already changed.

### 2. Always-on with regime-modulated sizing
All strategies always run, but **position size is scaled** based on regime fit:

- Bull trend: momentum at 1.0×, mean-reversion at 0.3×.
- Range: opposite weights.
- Crisis: everything at 0.2×.

Smoother equity curve, but more complex to manage.

## Building a regime-aware portfolio

A robust portfolio combines **uncorrelated strategies** that win in different regimes:

| Sleeve | Wins in | Losses tolerated in |
|--------|---------|---------------------|
| Trend following (long-only equity) | Bull trends | Sideways, bears |
| Short premium (condors, weekly) | Quiet ranges | Trends, vol spikes |
| Long vol (calendars, OTM puts) | Crises, vol expansions | Quiet markets |
| Mean reversion (pairs / RSI) | Quiet, low-trend | Strong trends |
| Cash | All (preserves capital) | (always lower expected return) |

Allocating across these → smoother equity curve. **Diversifying across regimes is more valuable than diversifying across stocks within one regime.**

## Backtesting across regimes

Always partition your equity curve by regime (or by year, or by VIX bucket) and look at performance separately.

A strategy with 25% CAGR overall might be:
- 60% in bull markets, −15% in bears.
- Or +15%/+18%/+20%/+22% steady — much more robust.

Avoid strategies whose entire profit came from **one regime**. They will revert.

## Common regime mistakes

1. **"This time is different."** — It's never different in the way you think. Markets do mean-revert.
2. **Holding the same strategy through a regime change** — the textbook way to give back a year of gains.
3. **Over-fitting regime detection** — too many states, too many parameters → unreliable.
4. **Confusing volatility with regime** — high vol can occur in both bull (melt-up) and bear (crisis) — need direction + vol jointly.
5. **Forgetting that **you** are part of the regime** — your psychology shifts with the market. Your "this isn't working" feeling often coincides with regime change.

## Reading list

- *The Most Important Thing* — Howard Marks (cycles, contrarian thinking).
- *Manias, Panics, and Crashes* — Charles Kindleberger.
- *Big Debt Crises* — Ray Dalio.
- *Adaptive Markets Hypothesis* — Andrew Lo.
