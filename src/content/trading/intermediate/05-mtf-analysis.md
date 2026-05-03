---
title: "Multi-Timeframe Analysis (MTFA)"
description: "\"The trend on a 5-minute chart is noise to a daily trader. The trend on a daily chart is noise to a weekly investor. Always know which game you're playing.\""
tier: intermediate
order: 5
source: "../TradingBot/docs/intermediate/05-mtf-analysis.md"
---
# 5. Multi-Timeframe Analysis (MTFA)

> "The trend on a 5-minute chart is noise to a daily trader. The trend on a daily chart is noise to a weekly investor. Always know which game you're playing."

A trade is only as good as its **alignment across timeframes**. MTFA gives you context, precision entries, and tighter stops.

## The top-down framework

| TF | Purpose | Question it answers |
|----|---------|---------------------|
| **Monthly** | Macro regime | Are we in a structural bull / bear? |
| **Weekly** | Primary trend | What's the dominant move? |
| **Daily** | Setup TF | Is there a tradeable pattern *now*? |
| **1h** | Entry TF | Where is the entry trigger? |
| **5–15m** | Execution / SL | Where exactly do I enter and place stop? |

You don't need all 5 — pick the **3 that match your style**:

| Style | Trend TF | Setup TF | Entry TF |
|-------|----------|----------|----------|
| Positional | Monthly | Weekly | Daily |
| Swing | Weekly | Daily | 1h |
| Intraday | Daily | 1h | 5m |
| Scalper | 1h | 15m | 1m |

Rule: **Trade in the direction of the trend TF.** Look for setups on the setup TF. Time the trigger on the entry TF.

## The "rule of 4–6"

The setup TF should be roughly **4–6× the entry TF**.
- Entry TF 5m → setup TF 30m or 1h. ✅
- Entry TF 5m → setup TF daily. ❌ Too far apart, you'll miss many bars worth of context.

## Practical workflow — swing long example

You scan daily charts after market close. Reliance shows up.

### Step 1: Weekly (trend)
- Price > 50-week EMA. Higher highs, higher lows.
- Verdict: **Uptrend.** Long-only.

### Step 2: Daily (setup)
- Stock pulled back 8% from recent high to the 50 EMA.
- Forming a bullish flag. RSI back to ~45 from overbought.
- Verdict: **Valid pullback setup.** Watch for trigger.

### Step 3: 1h (entry)
- Within the flag, price made a 1h higher high yesterday.
- Today, a 1h bullish engulfing closed above yesterday's high.
- Verdict: **Trigger fired.** Enter on next bar open.

### Step 4: 15m (stop)
- Last 15m swing low is at ₹2,810.
- SL placement: ₹2,805 (just below).

### Step 5: Sanity check
- Weekly trend: up ✅
- Daily setup: clean pullback ✅
- 1h trigger: confirmed ✅
- R:R = 1:3 with target at prior swing high ✅
- Position size: 1% capital ÷ (entry − SL) ✅

**Take the trade.**

## What to do when timeframes disagree

| Weekly | Daily | What to do |
|--------|-------|------------|
| Up | Up | Trade longs aggressively |
| Up | Down (pullback) | Wait for daily reversal, then long |
| Up | Sideways | Range trade or wait |
| Down | Up (counter-trend) | **Skip.** Counter-trend trades have low win rate |
| Down | Down | Short / stay flat (longs are dangerous) |

> **Never long when the weekly is in a downtrend** unless you're an experienced bottom-fisher. The market can stay irrational longer than your stop-loss can.

## The "fractal" principle

Charts look similar across timeframes — the same patterns (double tops, breakouts, pullbacks) appear on a 1m chart and a monthly chart. The **larger the TF**, the **more reliable** the signal — but the **fewer** the opportunities.

Scaling roughly:
- 1m chart: hundreds of "signals" per day, ~20% reliable.
- Daily chart: 1–3 signals per month per stock, ~50% reliable.
- Weekly chart: 1–2 signals per year, ~65% reliable.

Choose your reliability/frequency tradeoff consciously.

## MTFA mistakes to avoid

1. **Picking timeframes randomly per trade** — you'll cherry-pick whichever supports your bias. Lock your TFs in your trading plan.
2. **Ignoring the higher TF because "this 5-min setup looks great"** — recipe for fighting the trend.
3. **Using too many TFs** — analysis paralysis. 3 is enough.
4. **Switching TFs after entering** — if the trade went against you on the entry TF, don't suddenly justify holding by zooming out to the weekly.

## Putting it on the chart

In TradingView, you can layer:
- A higher-TF MA on a lower-TF chart (e.g., daily 50 EMA on a 1h chart).
- A "higher timeframe trend" indicator that shades the background by weekly trend direction.

This keeps the MTF context visible without flipping charts constantly.
