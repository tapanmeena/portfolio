---
title: "Futures"
description: "A futures contract is an agreement to buy/sell an asset at a fixed price on a future date. In India, equity & index futures are cash-settled (no physical delivery for index; sto…"
tier: intermediate
order: 2
source: "../TradingBot/docs/intermediate/02-futures.md"
---
# 2. Futures

A **futures contract** is an agreement to buy/sell an asset at a fixed price on a future date. In India, equity & index futures are cash-settled (no physical delivery for index; stock futures are now physically settled).

## Key terminology

| Term | Meaning |
|------|---------|
| **Underlying** | The asset (stock, index) the future tracks |
| **Lot size** | Fixed contract quantity (e.g., Nifty = 25, Reliance = 250) |
| **Expiry** | Last Thursday of the month (monthly); weekly available for indices |
| **Contract value** | Lot size × futures price (your full exposure) |
| **Margin** | What you actually pay (~15–25% of contract value) |
| **Spot** | Current cash market price of the underlying |
| **Basis** | Futures price − Spot price |
| **Premium / Discount** | Futures > Spot → premium; Futures < Spot → discount |
| **Open Interest (OI)** | Total outstanding contracts (not volume) |
| **Rollover** | Closing current month, opening next month before expiry |

## Why basis exists

Theoretical futures price:

$$ F = S \cdot e^{(r - d) \cdot t} $$

- $S$ = spot, $r$ = risk-free rate, $d$ = dividend yield, $t$ = time to expiry.
- In normal markets, futures trade at a small **premium** (cost of carry).
- A **discount** signals bearishness or expected dividends/corporate actions.

### Example
Nifty spot = 24,500. 1-month future = 24,560. Basis = +60 (premium of ~0.24%). Healthy.

If suddenly the future drops to 24,440 while spot stays — the discount signals heavy selling pressure or hedging.

## Margin types

| Margin | Purpose |
|--------|---------|
| **SPAN margin** | Risk-based, set by exchange |
| **Exposure margin** | Additional buffer |
| **MTM margin** | Daily settlement of unrealized P&L |

Total **initial margin** ≈ SPAN + Exposure. Brokers may demand more.

> **Leverage cuts both ways.** Nifty future at ₹6.1L value with ~₹1L margin = ~6× leverage. A 2% adverse move = 12% loss on margin.

## Open Interest — what it really tells you

OI = number of **open contracts** (not closed). Different from volume.

| Price | OI | Interpretation |
|-------|----|---------------|
| ↑ | ↑ | Long buildup (new buyers) — bullish |
| ↑ | ↓ | Short covering — fading bullishness |
| ↓ | ↑ | Short buildup (new sellers) — bearish |
| ↓ | ↓ | Long unwinding — fading bearishness |

This is the **OI matrix** — memorize it. It separates real buying from squeezes.

## Rollover

Last week of expiry month, traders shift positions to next month.
- **High rollover %** with rising OI = trend continuing into next month.
- **Low rollover** = positions being squared off, trend may reverse.

## Use cases for futures

### 1. Directional speculation
Cheaper than buying the cash equivalent (margin vs full cost). High risk.

### 2. Hedging a portfolio
Long ₹10L of Nifty 50 stocks? Short 1 Nifty future (~₹6L) to neutralize ~60% of market risk. Cheap insurance.

### 3. Pair trading / arbitrage
Long undervalued stock future, short overvalued one. Market-neutral.

### 4. Cash-Future arbitrage
Buy spot, short future when premium > cost of carry. Locked spread.

## Common futures pitfalls

- **Rolling at the wrong time** — rolling on expiry day = wide spreads, high cost. Roll 2–3 days earlier.
- **Ignoring overnight risk** — F&O can gap massively on news; SLs may get jumped.
- **Sizing as if it's cash** — leverage means a "small position" is actually huge.
- **Trading illiquid stock futures** — most stock futures have terrible liquidity except the F&O top-30.

## Position sizing for futures (the real formula)

You're sizing on **contract value**, not margin.

$$ \text{Lots} = \frac{\text{Capital} \times \text{Risk \%}}{|\text{Entry} - \text{Stop}| \times \text{Lot size}} $$

### Example
Capital ₹5,00,000, risk 1% = ₹5,000. Buy Nifty future at 24,500, SL 24,400 (100 pts risk). Nifty lot = 25.

$$ \text{Lots} = \frac{5{,}000}{100 \times 25} = 2 \text{ lots} $$

Even though margin allows 5+ lots, *risk-based sizing* says 2. **Always trade risk, not margin.**
