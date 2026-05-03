---
title: "Volatility Trading"
description: "Trading volatility itself as the asset, separate from price direction. Vol has its own behavior: mean-reverting, regime-shifting, and predictable in ways price isn't."
tier: advanced
order: 3
source: "../TradingBot/docs/advanced/03-volatility-trading.md"
---
# 3. Volatility Trading

Trading **volatility itself** as the asset, separate from price direction. Vol has its own behavior: mean-reverting, regime-shifting, and predictable in ways price isn't.

## Realized vs Implied volatility

- **Realized Volatility (RV)** — actual, historical std dev of returns.
- **Implied Volatility (IV)** — vol the option market is pricing in (extracted from option premiums via Black-Scholes).

The **vol risk premium**: on average, IV > RV. Option sellers earn this premium for taking the risk of volatility surprises.

## The IV surface

For a single underlying, plot IV across:
- **Strike** (x-axis) → **smile / skew**
- **Expiry** (y-axis) → **term structure**

Together → a 3D **vol surface**.

### Skew
For Indian indices (Nifty, Bank Nifty), **OTM puts have higher IV than OTM calls**. The market pays a premium for crash protection.

A steepening skew = rising fear. A flattening skew = complacency.

### Term structure
Plot ATM IV vs days to expiry:

- **Contango** (front IV < back IV) — normal, calm market.
- **Backwardation** (front IV > back IV) — panic, near-term event risk.

VIX going into backwardation often marks short-term capitulation bottoms.

## India VIX

The **NIFTY Volatility Index** — IV implied by Nifty option chain (similar to CBOE VIX methodology).

| India VIX level | Regime |
|-----------------|--------|
| < 12 | Complacent / quiet — short vol favored, but watch for surprise |
| 12–18 | Normal |
| 18–25 | Elevated — directional bets risky, vol selling lucrative |
| > 25 | Crisis — sell vol carefully (or buy if you expect more panic) |

VIX is **mean-reverting** (long-term ~15). Spikes typically retrace quickly. This drives many vol strategies.

## Vol cone

For each maturity (e.g., 30/60/90/180 days), plot historical RV percentiles. Compare current IV to the cone:

- IV at 80th percentile → expensive → favor selling.
- IV at 20th percentile → cheap → favor buying.

> **The single best entry filter for option trades:** what's the current IV percentile? Buying options at the 90th percentile is usually a losing trade no matter how good the chart.

## Strategies

### 1. Short Strangle / Iron Condor
Sell OTM call + OTM put. Profit if price stays in the range. Edge from IV > RV + theta decay.

- **Risk:** unbounded (strangle) or large (condor).
- **Best when:** IV percentile high, no major events, expecting range.
- **Indian context:** Bank Nifty weekly short strangles are a favorite — but blow-ups are violent. Always **cap risk with wings (condor)**.

### 2. Long Straddle / Strangle
Buy ATM call + ATM put. Profit on a big move (either direction). Pay theta + vega.

- **Risk:** premium paid (limited).
- **Best when:** IV is **low**, expecting expansion (pre-event setups, breakouts).

### 3. Calendar Spread
Sell front-month, buy back-month, same strike. Profit from term-structure normalization (front decays faster).

- **Best when:** front IV > back IV (backwardation) and you expect IV to normalize.

### 4. Diagonal
Like calendar but different strikes. Mix of directional and vol view.

### 5. Ratio spread
Buy 1 ATM call, sell 2 OTM calls. Negative gamma, positive theta. Capped upside.

### 6. VIX-based directional plays
- VIX spikes → market often bottoms within days. Buy index futures.
- VIX collapses → market complacent — sell vol or hedge.

(India VIX itself isn't directly tradable for retail; trade Bank Nifty/Nifty options to express the view.)

## Gamma scalping

You're long an ATM straddle (long gamma). As underlying moves:
- Up → delta becomes positive → sell some underlying to re-flatten.
- Down → delta becomes negative → buy some underlying to re-flatten.

You **collect realized vol** by re-hedging at extremes. Profit if **realized vol > implied vol** you paid.

This is professional market-maker bread-and-butter. Hard to scale as retail because of:
- Transaction costs eating gamma profits.
- Need for tight, frequent re-hedging.

## Vega-neutral strategies

Long one vol leg, short another → net vega ≈ 0. You're betting on **relative vol** between expiries / strikes, not absolute level.

Examples:
- Calendar spreads (vega-neutral if sized right).
- Sell front strangle, buy back-month wings.
- Skew trades (sell OTM puts vs buy OTM calls if skew flat).

## Volatility forecasting models

- **GARCH(1,1)** — captures vol clustering. $\sigma_t^2 = \omega + \alpha r_{t-1}^2 + \beta \sigma_{t-1}^2$.
- **EWMA** (RiskMetrics) — exponentially weighted variance. Simple, robust.
- **HAR-RV** — uses daily, weekly, monthly realized vol components. Outperforms simple models.

In practice, even **5-day rolling RV** is a decent baseline. Fancy models add ~5–15% accuracy.

## A live vol setup — pre-RBI policy

**Setup:** RBI MPC announcement tomorrow.

**Observations:**
- Bank Nifty IV percentile: 78th. (High — vol bid up.)
- Term structure: backwardated (weekly IV > monthly).

**Trade idea: Calendar spread**
- Sell weekly ATM straddle.
- Buy monthly ATM straddle (same strike).

**Why it works:**
- After event, weekly IV crashes faster than monthly (event risk priced into front).
- You profit from **vol normalization** (term structure flattens).
- Net vega ≈ neutral, net theta positive (front decays faster).

**Risk:** Sharp directional move beyond breakeven hurts (gamma risk on the short leg). Hedge if needed.

## Vol regime transitions

Vol regimes don't last forever. Watch for:

| Signal | What it means |
|--------|---------------|
| VIX hits multi-month low | Complacency → short vol risky, buying tail hedges cheap |
| Skew steepens during a rally | Smart money buying puts → reversal warning |
| Term structure backwardates from contango | Stress arriving → short-vol shorts unwinding fast |
| RV surges past IV | Sellers bleeding — close shorts, consider buying vol |

## Common vol-trading mistakes

1. **Selling vol because "premiums are high"** without checking realized vs implied.
2. **Naked short strangles** — works for years, then one day blows up everything.
3. **Ignoring gamma near expiry** — short positions can swing 10× delta in a few hours.
4. **Forgetting margin requirements expand in volatile markets** — getting margin-called at the worst time.
5. **Not having a hedge for tail events** — buy cheap OTM wings as insurance.

> Nassim Taleb's adage: "Don't pick up nickels in front of a steamroller." Vol selling has spectacular Sharpe — until the steamroller arrives.

## Reading list

- *Volatility Trading* — Euan Sinclair.
- *Option Volatility & Pricing* — Sheldon Natenberg.
- *Dynamic Hedging* — Nassim Taleb.
