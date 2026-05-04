---
title: "Indicator Combinations — Confluence That Actually Works"
description: "In [Chapter 5](05-indicators.md) you met the indicators one by one. In the wild, no single indicator is enough. Pros stack 2–3 indicators from different families so each one ans…"
tier: beginner
order: 6
source: "../TradingBot/docs/learn/06-indicator-combinations.md"
---
# 6. Indicator Combinations — Confluence That Actually Works

In [Chapter 5](05-indicators.md) you met the indicators one by one. In the wild, **no single indicator is enough**. Pros stack 2–3 indicators from *different families* so each one answers a different question. That overlap is called **confluence**, and it's the difference between a coin-flip signal and a setup with an edge.

> ⚠️ This chapter is a toolkit, not a list of "buy buttons." Every combo below has failure modes. Always pair with the rules in [Risk Management](07-risk-management.md).

---

## The two rules of combining indicators

### Rule 1 — One per family, max
The four families from Chapter 5 each answer a different question:

| Family | Question | Examples |
|---|---|---|
| Trend | *Which direction?* | EMA, MACD, Supertrend, ADX |
| Momentum | *How strong? Overbought?* | RSI, Stochastic, CCI |
| Volatility | *How much movement?* | Bollinger Bands, ATR |
| Volume | *Is the move real?* | VWAP, OBV, MFI |

Stacking RSI **and** Stochastic **and** CCI is **not** confluence — they all measure momentum and will agree (and be wrong) at the same time. That's called **multicollinearity**, and it gives a false sense of certainty.

### Rule 2 — Two or three. Never five.
Each extra indicator narrows your signals — fast. Five indicators that "must all align" produce maybe 2 trades a year, half of which still lose. Stick to **trend + momentum**, or **trend + volume**, or **volatility + momentum**. That's it.

---

## The 7 combos worth learning

Each combo below follows the same structure: **what it shows → entry/exit logic → when it fails**.

### 1. EMA(20) + EMA(50) + RSI(14) — the "hello world" combo
- **Trend filter:** price above both EMAs and 20 > 50 = uptrend regime.
- **Momentum trigger:** RSI dips to 40–50 zone (a *pullback*, not oversold) and turns up.
- **Entry:** next candle close above the prior high.
- **Stop:** below the recent swing low or below 50 EMA, whichever is closer.
- **Fails when:** market is choppy/sideways — EMAs cross repeatedly and RSI oscillates around 50. Use ADX > 20 as a regime filter to avoid this.

### 2. MACD + 200 EMA — trend-aligned momentum
The classic "only trade with the major trend" filter.
- **Long only** when price > 200 EMA.
- **Entry:** MACD line crosses above signal line *while* histogram turns positive.
- **Stop:** below recent swing low.
- **Fails when:** strong reversals — the 200 EMA is slow, so it'll keep you long into the start of a bear market for weeks. Combine with a hard stop, not "wait for 200 EMA cross."

### 3. Bollinger Bands + RSI — mean reversion
For ranging stocks, not trending ones.
- **Setup:** price tags the **lower** Bollinger Band **and** RSI < 30.
- **Trigger:** next candle closes back inside the band (rejection of the extreme).
- **Target:** middle band (20 SMA); aggressive target is the upper band.
- **Stop:** a defined % below the low of the rejection candle.
- **Fails when:** the stock is in a strong downtrend — price walks down the lower band for days and RSI stays oversold. Filter: only take it when price > 200 SMA.

### 4. VWAP + Volume — the intraday workhorse
Used by institutions and Indian retail intraday traders alike.
- **Bias:** price > VWAP = bullish for the day; price < VWAP = bearish.
- **Entry (long):** pullback to VWAP **with declining volume**, then a bounce **with rising volume**.
- **Stop:** below VWAP by 1× ATR(14, 5-min).
- **Exit:** end of day (intraday-only tool — VWAP resets at 9:15 IST every session).
- **Fails when:** gap days or news-driven moves — VWAP gets dragged by the open and gives weak signals. Skip VWAP trades in the first 15 minutes.

### 5. Supertrend + RSI — the Indian retail favourite
Hugely popular on Zerodha Kite and TradingView in the Indian community because Supertrend gives an unambiguous green/red regime.
- **Regime:** Supertrend (10, 3) green = long bias only.
- **Entry:** RSI(14) crosses up through 50 *while* Supertrend is green.
- **Stop:** the Supertrend line itself (it trails — that's the point).
- **Fails when:** whipsaw markets — Supertrend flips colour every 2–3 candles and you get chopped. Add a higher-timeframe Supertrend filter (e.g. only take 15-min signals when the 1-hour Supertrend is also green).

### 6. Donchian 20-day high + ADX — the breakout filter
Donchian channels = highest high / lowest low of last N periods. The 20-day high is the original "Turtle Trader" breakout signal.
- **Entry:** close above 20-day high **and** ADX(14) > 20 (trend strength is real).
- **Stop:** 2× ATR below entry, or the 10-day low (Turtle exit).
- **Fails when:** ADX is low — most "breakouts" in low-ADX environments are fakeouts that revert in 1–2 days. The ADX filter is what separates this from naive breakout chasing.

### 7. Moving Average Crossover + Volume — classic with a guard
The textbook "20 crosses 50" with one critical addition.
- **Signal:** 20 EMA crosses above 50 EMA.
- **Confirmation:** the crossover candle (or next one) closes with **volume > 1.5× the 20-day average volume**.
- **Stop:** below the 50 EMA.
- **Fails when:** crossover happens on light volume — these are the textbook fakeouts everyone warns about. Without the volume filter this combo is barely better than random.

---

## Combos to *avoid*

These show up everywhere on YouTube and they're traps:

- **RSI + Stochastic + CCI** — three momentum indicators saying the same thing. Looks confluent, isn't.
- **5 EMAs of different periods** — it's still one indicator. You'll just pattern-match the spaghetti.
- **MACD + RSI + Stochastic + Bollinger + Ichimoku** — analysis paralysis. By the time everything aligns, the move is over.
- **Any combo without a regime filter** — every momentum signal needs trend context, every mean-reversion signal needs a "is this stock actually ranging?" check.

---

## How to actually deploy a combo

1. **Pick one combo.** Just one. From this chapter.
2. **Define the rules in writing** — exact entry, exact stop, exact exit. If you can't write it as code, you can't execute it.
3. **Backtest by hand** on 50 historical setups (Chapter [Backtesting](../intermediate/08-backtesting.md) covers this properly later). Count wins/losses and average R:R.
4. **Paper trade for 1 month.** No real money.
5. **Then** trade ¼-size for another month. Only scale up if the live numbers match the backtest.

If you skip steps 3–5, you're not using a strategy — you're using vibes with extra steps.

---

## Common mistakes

- **Curve fitting** — tweaking parameters until past data looks great. The market doesn't care about your optimised RSI period of 11.7.
- **Ignoring market regime** — a momentum combo in a ranging market loses every time, and vice versa. Always check: trending or ranging? (ADX > 25 = trending.)
- **Adding indicators after losses** — "if I add MACD too, this loss wouldn't have happened." It also wouldn't have caught your last 6 wins. Don't reverse-engineer indicators onto losing trades.
- **Trading every signal** — even a great combo signals 3× more often than you should trade. Filter by trend, by sector strength, by your own daily loss limit.

---

## TL;DR

- Confluence = indicators from **different families** agreeing.
- Two or three indicators. Never five.
- Each combo has a market regime where it works and one where it dies — know both.
- A combo without an exit rule and a stop-loss isn't a strategy.
