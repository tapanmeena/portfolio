---
title: "Statistical Arbitrage"
description: "Stat arb = trading mathematical relationships between instruments, not directional bets on the market. Market-neutral, mean-reversion based, edge from many small wins."
tier: advanced
order: 2
source: "../TradingBot/docs/advanced/02-stat-arb.md"
---
# 2. Statistical Arbitrage

Stat arb = trading **mathematical relationships between instruments**, not directional bets on the market. Market-neutral, mean-reversion based, edge from many small wins.

## The core idea — pairs trading

Two related stocks (e.g., HDFC Bank and ICICI Bank) tend to move together. When they **diverge** more than usual, bet that they'll converge.

```
Spread = Price_A − β × Price_B

If spread is unusually high → short A, long β units of B
If spread is unusually low  → long A, short β units of B
Exit when spread returns to mean.
```

Profit doesn't depend on market direction — **only on the relationship reverting**.

## Cointegration vs correlation — the key distinction

- **Correlation:** "Their *returns* move together day to day." — Can be high but spread still drifts forever.
- **Cointegration:** "Their *prices* are bound by an equilibrium." — The spread is **stationary** and reverts.

Pairs trading needs **cointegration**, not just correlation.

## The Engle-Granger test (in plain words)

1. Regress price of A on price of B → get hedge ratio β and residual (= spread).
2. Run an **Augmented Dickey-Fuller (ADF) test** on the residual.
3. If ADF p-value < 0.05 → spread is stationary → pair is cointegrated → tradeable.

Python:
```python
from statsmodels.tsa.stattools import coint
score, pvalue, _ = coint(price_A, price_B)
if pvalue < 0.05:
    print("Cointegrated — candidate pair")
```

## Workflow for pairs trading

### Step 1: Universe & candidate pairs
Pick a homogeneous universe (e.g., NIFTY BANK constituents). Generate all $\binom{n}{2}$ pairs. With 12 banks → 66 pairs.

### Step 2: Cointegration screen
For each pair, run cointegration test on **rolling 1-year window**. Keep pairs with p < 0.05.

### Step 3: Compute spread Z-score
$$ z_t = \frac{\text{spread}_t - \mu_{spread}}{\sigma_{spread}} $$

Using rolling 30-day or 60-day mean and std.

### Step 4: Trade signals
- $z > +2$ → spread too wide → **short the spread** (short A, long β·B).
- $z < -2$ → spread too narrow → **long the spread** (long A, short β·B).
- $|z| < 0.5$ → exit.

### Step 5: Stop loss
- $|z| > 4$ → relationship broke. **Exit and re-evaluate cointegration.**
- Time stop: exit after N days regardless.

## Sizing the legs

Position sizes are **inversely proportional** to prices and proportional to the hedge ratio:

If A = ₹1,500, B = ₹800, β = 1.6:
- For ₹1,00,000 long A → buy 66 shares of A
- Hedge: short 66 × 1.6 × (1500/800) = **198 shares of B** (roughly equivalent rupee exposure)

Goal: dollar/rupee-neutral and beta-neutral leg sizes.

## Real-world frictions

- **Cash-side shorting** in India is restricted to intraday → most pairs trades use **stock futures** to short.
- **Different lot sizes** between two F&O stocks → exact hedge ratios require rounding.
- **Dividend dates / corporate actions** distort the spread temporarily — exclude or adjust.
- **Cointegration breaks** — historically cointegrated pairs decouple (e.g., bank merger). Re-test monthly.
- **Crowded trade** — popular pairs have thin edge; the Z-score reverts so quickly you can't capture it.

## Beyond pairs — multi-asset stat arb

Modern stat arb uses **portfolios of N stocks**, not just 2:

- Run a regression / PCA on a basket → find the principal components.
- Build a portfolio that's "neutral" to the first few PCs (market, sector).
- The residual portfolio is mean-reverting → trade it.

This is what funds like Renaissance, D.E. Shaw, Two Sigma do at scale (across thousands of stocks, with superior infrastructure and signal speed). Retail can play simple versions.

## Beta-neutral & dollar-neutral strategies

- **Dollar-neutral:** equal long and short capital ($\sum w = 0$).
- **Beta-neutral:** $\sum w_i \beta_i = 0$ (zero net market exposure).
- **Sector-neutral:** equal long/short within each sector.

A market-neutral portfolio earns the **alpha** (selection skill) without taking **beta** (market direction). In return, you give up market upside but also crash protection.

## Mean reversion at the single-stock level

Same idea, applied to one stock vs its own mean:

- **Bollinger reversion:** stock 2 std away from 20 SMA → fade.
- **OU process fit:** model log-price as Ornstein-Uhlenbeck mean-reverting → trade extremes.
- **Sigma reversion intraday:** fade large moves in liquid F&O stocks at the open.

These work well in **range-bound regimes** and in **liquid large-caps**. They fail catastrophically in trending markets — always have a regime filter (see [Chapter 5](05-market-regimes.md)).

## A working pairs-trade example

**Pair:** HDFC Bank (A) and ICICI Bank (B)
**Lookback:** 1 year for cointegration, 60 days rolling for Z-score.
**Hedge ratio (β):** 0.92 (computed via OLS on log prices).

Today's signal:
- Spread = log(HDFCBANK) − 0.92 × log(ICICIBANK)
- Z-score = +2.3

**Trade:**
- Short 100 shares HDFC Bank (futures, 1 lot ~550 shares — adjust)
- Long ~92 equivalent ICICI Bank (futures)

**Exit conditions:**
- Z-score returns to 0 (target).
- Z-score breaches +4 (stop).
- 30 days elapsed (time stop).

**Expected P&L per trade:** small (50–80 bps) but high win rate (~70%). Run **dozens of pairs simultaneously** — the law of large numbers does the work.

## When stat arb fails

- **Regime change:** a structural event breaks historical relationships (e.g., a merger, regulatory change).
- **Crowding:** retail/quant funds piling in arbitrage away the edge.
- **Volatility spikes:** spreads widen to "infinity" in panic — your stop loss may be too late.
- **Black swan correlated to the spread:** if both legs move on the same news, the hedge fails.

Always have a **portfolio-level** kill switch. If aggregate stat arb book drawdown > X%, deleverage. Don't try to "average down" the spread — that's the universal way stat arb shops blow up (LTCM, Amaranth lite-flavors).

## Tools / data

- **Python**: `statsmodels` for cointegration & ADF, `pandas` for data wrangling, `vectorbt` or custom for backtesting.
- **Data**: minute-bar futures data is ideal; daily works for slower variants.
- **Execution**: needs near-simultaneous fills in both legs → broker API + low latency.

## Reading list

- *Statistical Arbitrage* — Andrew Pole.
- *Algorithmic Trading: Winning Strategies and Their Rationale* — Ernie Chan (chapters on pairs).
- *Pairs Trading: Quantitative Methods and Analysis* — Ganapathy Vidyamurthy.
