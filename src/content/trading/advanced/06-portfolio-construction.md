---
title: "Portfolio Construction"
description: "A trader thinks in trades. A portfolio manager thinks in allocations across strategies and assets. This chapter is about getting from \"I have 5 ideas\" to \"I have a coherent, ris…"
tier: advanced
order: 6
source: "../TradingBot/docs/advanced/06-portfolio-construction.md"
---
# 6. Portfolio Construction

A trader thinks in trades. A portfolio manager thinks in **allocations across strategies and assets**. This chapter is about getting from "I have 5 ideas" to "I have a coherent, risk-balanced book."

## Why portfolio construction matters

Two strategies, each with 15% CAGR / 20% drawdown, run together with low correlation can yield ~15% CAGR / 12% drawdown. That's a **better Sharpe** without sacrificing return. Free lunch via diversification.

## The covariance / correlation matrix

For N strategies (or stocks), you need:
- Mean returns $\mu_i$.
- Volatilities $\sigma_i$.
- Pairwise correlations $\rho_{ij}$.

Portfolio variance:
$$ \sigma_p^2 = \sum_i w_i^2 \sigma_i^2 + 2\sum_{i<j} w_i w_j \sigma_i \sigma_j \rho_{ij} $$

Diversification works only when $\rho < 1$. The lower (or more negative), the better.

## Mean-variance optimization (Markowitz)

The classical method: for a given target return, find weights that **minimize variance**.

Output: an **efficient frontier** of optimal portfolios.

### Why pure Markowitz often fails in practice
- Estimates of $\mu$ are notoriously noisy → optimizer puts huge weights on the highest-mean asset.
- Correlation matrices are unstable, especially in crises.
- Result: very concentrated, high-turnover portfolios that underperform live.

**Fix:** Use shrinkage estimators (Ledoit-Wolf), Black-Litterman with priors, or simpler heuristics below.

## Risk parity

Rather than equal **capital weights**, equal **risk contributions**.

$$ w_i \cdot \sigma_i \approx w_j \cdot \sigma_j \quad \forall i, j $$

A high-vol asset gets a smaller weight; a low-vol asset gets a larger one. Each contributes the same to portfolio risk.

### Example
- Strategy A: $\sigma = 30\%$
- Strategy B: $\sigma = 10\%$

Equal capital (50/50) → A dominates the risk.
Risk parity → B gets 75% capital, A gets 25%, both contribute equal vol.

This is what Bridgewater's "All Weather" portfolio is built on.

## The Kelly criterion (multi-asset version)

For multiple correlated bets, the optimal fraction matrix is:
$$ \mathbf{f}^* = \Sigma^{-1} \boldsymbol{\mu} $$

(where $\Sigma$ is covariance, $\boldsymbol{\mu}$ is excess returns vector).

Same caveat as single-asset Kelly: full Kelly is too aggressive. Use **fractional Kelly** (¼ to ½).

## Volatility targeting

Pick a portfolio vol target (e.g., 15% annualized). Scale leverage up/down to maintain it.

```
target_vol = 0.15
realized_vol = compute_30d_vol(portfolio)
leverage = target_vol / realized_vol
```

Pros:
- Smoother equity curve.
- Reduces blow-up risk (auto-deleverages in crises).

Cons:
- Procyclical when vol spikes mid-trade (forces selling at bad prices).
- Adds turnover.

Most professional CTA / hedge funds run **vol-targeted books**.

## Position sizing for a multi-strategy book

For each strategy, decide:
1. **Capital allocation** — % of total capital.
2. **Risk allocation** — % of total daily VaR / vol budget.
3. **Max drawdown trigger** — auto-deleverage if breached.

A simple framework:

| Strategy | Capital % | Vol target | Stop-loss (DD trigger) |
|----------|-----------|-----------|------------------------|
| Momentum (long equity) | 40% | 18% | −20% |
| Mean reversion / pairs | 25% | 8% | −10% |
| Short premium options | 20% | 12% | −12% |
| Long vol / tail hedge | 5% | 30% | (no stop, hedge) |
| Cash | 10% | 0% | — |

Total portfolio vol target ≈ ~15%, with explicit drawdown circuit breakers per sleeve.

## Correlation in crisis

> "When you need diversification most, you have it least."

In normal times, strategies might be uncorrelated. In a crisis (March 2020, August 2024 carry-trade unwind), **everything correlates**. Long equity, short vol, mean-reversion — all hit at once.

**Defense:**
- Maintain a small **always-on long-vol** sleeve (cheap OTM puts on Nifty).
- Hold meaningful **cash** (5–20%).
- Have **non-equity diversifiers** (gold, bonds, USD-denominated).

These positions lose money 95% of the time. The 5% they pay off, they save the entire portfolio.

## Factor exposure

Even an "actively managed" portfolio is often a closet-bet on standard factors:

| Factor | Description | Long-term premium |
|--------|-------------|-------------------|
| **Market** (β) | Long equity index | Yes |
| **Size** | Small-cap minus large-cap | Modest |
| **Value** | Cheap minus expensive (low P/B) | Yes (long history) |
| **Momentum** | Past winners minus losers | Yes (strongest) |
| **Quality** | High ROE/low debt minus opposite | Yes |
| **Low volatility** | Low-vol stocks beat high-vol risk-adjusted | Yes |

Run a regression of your portfolio returns on these factors. **Most "alpha" turns out to be hidden factor exposure.** Genuine alpha (residual after factors) is rare.

If your strategy is just "long momentum + long quality," you don't need fancy backtests — buy the relevant factor ETFs and save costs.

## Rebalancing

Even great portfolios drift. Rebalance:
- **Time-based**: quarterly or monthly.
- **Threshold-based**: when a position drifts > 5% from target.
- **Vol-targeted**: continuous rebalancing to maintain vol budget.

Trade-off: more frequent → tighter to plan but higher costs.

## A practical multi-strategy portfolio (₹50L example)

Capital ₹50L, target portfolio vol 12%:

| Sleeve | Strategy | Capital | Notes |
|--------|----------|---------|-------|
| Long equity | Momentum top-15 NSE | ₹15L | Quarterly rebalance |
| Long equity | Pullback swing trading | ₹10L | Active |
| Stat arb | Pairs trading (banks) | ₹8L | Always-on |
| Options | Short Nifty/Bank Nifty weekly condors | ₹6L (margin) | Weekly cycle |
| Tail hedge | Long monthly OTM Nifty puts | ₹0.5L | Always rolling |
| Cash | Liquid funds | ₹10.5L | Dry powder + buffer |

Expected combined: ~14–18% CAGR with ~12–15% max DD if regimes are normal. A regime change can hurt — but no single sleeve can blow up the whole book.

## Drawdown management

Pre-define what happens at each drawdown level:

| Portfolio DD | Action |
|--------------|--------|
| 5% | Normal — no action |
| 10% | Reduce active exposure by 25% |
| 15% | Reduce by 50%, switch off worst-performing strategies |
| 20% | Move to 70% cash, only run highest-conviction sleeve |
| 25% | Stop trading entirely. Full review. Don't restart for 30 days. |

This is a **discipline mechanism**. Without pre-commitment, you'll over-trade out of drawdowns and dig deeper.

## Tracking & attribution

Every month, decompose returns:
- Total portfolio return.
- Per-sleeve contribution.
- Per-strategy P&L.
- Per-factor exposure.

This tells you what actually made/lost money — not what you *think* did. Often surprising.

## Reading list

- *Active Portfolio Management* — Grinold & Kahn (the institutional bible).
- *The Intelligent Asset Allocator* — William Bernstein.
- *Asset Management* — Andrew Ang (factor investing).
- *Expected Returns* — Antti Ilmanen (very deep).
