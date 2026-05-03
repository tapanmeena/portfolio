---
title: "Screening & Watchlists"
description: "You can't trade what you don't see. Screening = systematically narrowing the universe of 5,000+ stocks to the 5–10 worth your attention today."
tier: intermediate
order: 7
source: "../TradingBot/docs/intermediate/07-screening.md"
---
# 7. Screening & Watchlists

You can't trade what you don't see. **Screening = systematically narrowing the universe of 5,000+ stocks to the 5–10 worth your attention today.**

## The funnel

```
Universe (5,000 stocks)
       ↓ liquidity filter
Tradeable (~500 stocks)
       ↓ regime filter (above 200 SMA, etc.)
In play (~150)
       ↓ setup scan (today's pattern)
Candidates (5–15)
       ↓ manual chart review
Watchlist (3–5)
       ↓ entry trigger fires
Trade
```

Each stage cuts the list by 5–10×. By the end, you're staring at a handful of charts, not thousands.

## Liquidity filter (run once a month)

Minimum criteria to even consider a stock:

- **Avg daily volume ≥ ₹10 crore** (₹1 crore for very small accounts).
- **Avg daily delivery volume > 30%** (filters out pure operator stocks).
- **In F&O list** if you trade derivatives (~200 stocks).
- **Listed > 1 year** (avoid IPO chaos).

Result: a curated **"Tradeable Universe"** of 200–500 stocks. Save it as a watchlist.

## Regime filter (daily)

Keep only stocks that match the broad market regime:

| Market regime | Filter |
|---------------|--------|
| Bullish | Stock close > 200 SMA, > 50 SMA, RS > 1 |
| Bearish | Stock close < 200 SMA, < 50 SMA, RS < 1 |
| Neutral | Filter to range-bound names, RS near 1 |

This is where most retail goes wrong — they trade longs when their universe is broadly below the 200 SMA. Macro alignment matters.

## Setup scans

Now apply your **specific setup** filter. Examples:

### A. 52-week-high breakout
```
Close = 52-week High
AND Volume > 1.5 × Avg Volume(20)
AND Close > Open (green candle)
```

### B. Bollinger squeeze release
```
BBWidth(20) at 6-month low (squeeze formed in last 5 days)
AND Today close > Bollinger Upper(20)
AND RVOL > 2
```

### C. RSI oversold in uptrend (mean reversion)
```
Close > 200 SMA
AND RSI(14) < 30
AND Today is a green candle (reversal)
```

### D. Pullback to 20 EMA
```
Close > 50 EMA > 200 EMA
AND Low touched 20 EMA today
AND Bullish reversal candle (hammer / engulfing)
```

### E. Momentum / IBD-style RS Top
```
Stock RS rating > 80 (top 20% performers vs index)
AND Earnings growth > 25% YoY
AND Within 15% of 52-week High
```

## Tools for screening (India)

| Tool | Strength |
|------|----------|
| **Chartink** | Free, fast, technical scans. Custom syntax. |
| **Screener.in** | Best for fundamentals (EPS, ROCE, debt, growth). |
| **Trendlyne** | Combined technical + fundamental, scoring system. |
| **TradingView Screener** | Global, customizable, integrates with charts. |
| **NSE official** | Bhavcopy, FII/DII data, raw data downloads. |
| **Sensibull** | Options scans (high IV, OI buildup, etc.). |

For traders who code: scrape NSE Bhavcopy daily into SQLite/Postgres → run custom Python screens. Total control, zero subscription cost.

## Relative Strength (RS)

$$ \text{RS}_{stock} = \frac{\text{Stock return over N days}}{\text{Index return over N days}} $$

- RS > 1 → outperforming the market.
- Trade longs in **top RS** stocks (institutions buy strength).
- Trade shorts in **bottom RS** stocks (weakness persists).
- IBD-style **RS Rating** ranks stocks 1–99 vs the universe.

> "Buy strength, sell weakness" is the single most profitable mantra in trend-following.

## Sector rotation

Money rotates between sectors over the cycle:

```
Early bull:  Financials, Real Estate, Auto, Consumer Durables
Mid bull:    Industrials, Capital Goods, Materials
Late bull:   Energy, Commodities
Bear:        Defensives — FMCG, Pharma, Utilities
```

Daily check: which sector indices (Nifty Bank, Nifty IT, Nifty Auto, Nifty Pharma, etc.) are leading in 1-week and 1-month performance? **Trade the leaders, avoid the laggards.**

## Watchlist hygiene

Your watchlist is a **living document**, not a hoarding spot.

Rules:
- Max **15 stocks** at any time. More than that and you can't track them.
- **Tier them:** A-tier (ready to trade today), B-tier (watching for setup), C-tier (long-term radar).
- **Rotate weekly.** If a stock hasn't given a setup in 2 weeks, demote it.
- Note **why** each stock is on the list (specific setup, level, catalyst).

## Pre-market routine (15 minutes, daily)

A repeatable morning ritual:

1. **Check global markets** — US closed up/down? Asian markets now? SGX Nifty?
2. **Overnight news** — any earnings, RBI/Fed news, geopolitical events.
3. **FII/DII data from yesterday** — net buy/sell.
4. **Update your A-tier watchlist** — note key levels, set alerts.
5. **Decide max trades for the day** (typically 1–3).
6. **Walk away from the screen until 09:30** (skip the open noise).

This single discipline alone separates pros from "phone-trader" amateurs.

## Building automated alerts

Once your watchlist is set, you don't need to **stare**. Use TradingView / Chartink alerts:
- Price crosses key level
- Volume spike (RVOL > 2)
- Indicator condition (RSI < 30)
- Pattern formation

Get notified → walk over → make a decision. Saves hours per day.
