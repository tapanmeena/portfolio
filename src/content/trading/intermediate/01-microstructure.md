---
title: "Market Microstructure"
description: "The mechanics of how a trade actually happens. Understanding this turns you from a \"price taker\" into someone who can read order flow."
tier: intermediate
order: 1
source: "../TradingBot/docs/intermediate/01-microstructure.md"
---
# 1. Market Microstructure

The mechanics of *how* a trade actually happens. Understanding this turns you from a "price taker" into someone who can read order flow.

## The order book (Level 2 / Market Depth)

Every stock has a live, two-sided **limit order book (LOB)**:

```
        BIDS (buyers)        |        ASKS (sellers)
  Qty       Price            |  Price        Qty
  500   →   2451.05          |  2451.20  ←   300
  1200  →   2451.00          |  2451.25  ←   800
  3500  →   2450.95          |  2451.30  ←   2000
  ...                        |  ...
```

- **Best bid** = highest buy price.
- **Best ask** = lowest sell price.
- **Spread** = best ask − best bid.
- **Depth** = total quantity stacked at each level.

NSE shows **5 levels** by default (top 5 on each side). Brokers offering "20-depth" show 20.

### What the book tells you

- **Tight spread + deep stack** → liquid, safe to trade size.
- **Wide spread + thin stack** → illiquid, expect slippage.
- **Iceberg / hidden orders** → only a slice is visible; large players hide size.
- **Spoofing** (now illegal): fake large orders to mislead. Pulls before getting hit.

## Order flow & tape reading

The **time & sales tape** shows every executed trade. Reading it:

- Repeated trades **lifting the offer** (printing at ask) = buying pressure.
- Repeated trades **hitting the bid** = selling pressure.
- Sudden **block prints** = institutional activity.

Most retail tools don't expose tape well; pro platforms (Bookmap, Sierra Chart) do.

## Liquidity

| Term | Meaning |
|------|---------|
| **Tight market** | Small spread, easy to trade |
| **Wide market** | Large spread, costly to trade |
| **Deep market** | Big size at each level — absorbs orders without moving price |
| **Thin market** | Small quantities — your order moves price |
| **Slippage** | Difference between expected and actual fill price |

**Rule:** Your single order should be ≤ 1% of the **average daily volume (ADV)** to avoid moving the market against yourself.

## Auctions: open & close

NSE has special auction sessions that determine **single-price equilibrium**:

- **Pre-open (09:00–09:15)** — orders collected, indicative price published, single matching at 09:08:00.
- **Closing auction (15:30–15:40)** — the official **close price** for the day.

Why it matters:
- Many index/MF rebalances happen at the **closing price** → predictable end-of-day flows in index stocks.
- Pre-open is volatile and noisy — most pros skip the first 5–15 minutes.

## Trading sessions & the day's rhythm

| Time (IST) | Behavior |
|------------|----------|
| 09:15–09:30 | Volatile open. Gaps fill or extend. Avoid unless you have an opening-range strategy. |
| 09:30–11:30 | Trend day or reversal day usually establishes. High volume. |
| 11:30–14:00 | "Lunch" lull. Lower volume. Be careful with breakouts (often fakeouts). |
| 14:00–15:15 | Smart money moves. Trends extend or reverse. |
| 15:15–15:30 | Squaring off, MIS auto-close at ~3:20. Volatile. |

## Tick size, lot size, freeze quantity

- **Tick** — minimum price change (₹0.05 for cash equity).
- **Lot size** — F&O contract unit (e.g., Nifty = 25, Bank Nifty = 15, varies per stock).
- **Freeze quantity** — max single order size in F&O. Bigger orders get rejected.

## Settlement cycle

- **T+1** — cash equity. Buy today, shares in demat tomorrow. Funds out tomorrow.
- **F&O** — daily MTM, contract settles on expiry.

## Brokerage & charges (the silent killer)

For a typical Indian intraday equity trade (₹1,00,000 turnover):

| Charge | Approx |
|--------|--------|
| Brokerage (₹20 flat) | ₹20 |
| STT (sell side, 0.025% intraday) | ₹25 |
| Exchange txn (~0.00322%) | ₹3 |
| GST (18% on brokerage + txn) | ₹4 |
| SEBI + stamp | ₹2 |
| **Total round trip** | **~₹54 = 0.054%** |

For delivery (CNC), STT is 0.1% on **both** sides — much costlier for active trading.

> If your strategy's avg edge per trade is < 0.2%, costs will eat you alive.
