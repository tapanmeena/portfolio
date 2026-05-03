---
title: "Quantitative Foundations"
description: "The math you actually need. Not for academic purity — for making better trading decisions under uncertainty."
tier: advanced
order: 1
source: "../TradingBot/docs/advanced/01-quant-foundations.md"
---
# 1. Quantitative Foundations

The math you actually need. Not for academic purity — for making **better trading decisions** under uncertainty.

## Returns: arithmetic vs log

**Arithmetic return** of a single period:
$$ r_t = \frac{P_t - P_{t-1}}{P_{t-1}} $$

**Log return:**
$$ \ell_t = \ln\!\left(\frac{P_t}{P_{t-1}}\right) $$

Use **log returns** for analysis because:
1. They're **time-additive**: $\ell_{1\to N} = \sum \ell_t$.
2. They're approximately symmetric (better for statistical models).
3. They handle compounding cleanly.

Convert: $r = e^\ell - 1$.

## Distribution of returns

The textbook says returns are normally distributed. **They aren't.**

Real-world equity returns exhibit:
- **Fat tails** (kurtosis > 3) — extreme moves happen far more often than normal predicts.
- **Negative skew** — crashes are sharper than rallies.
- **Volatility clustering** — quiet days follow quiet days, big days follow big days (GARCH effect).
- **Autocorrelation in absolute returns** but not in returns themselves.

> Assuming normality is the #1 source of risk model failure. LTCM, 2008, COVID — all "5-sigma" events that statistically shouldn't happen in the lifetime of the universe.

## Volatility — the core concept

**Standard deviation** of returns over a window:
$$ \sigma = \sqrt{\frac{1}{N-1}\sum (r_i - \bar{r})^2} $$

**Annualization** (assuming 252 trading days):
$$ \sigma_{annual} = \sigma_{daily} \cdot \sqrt{252} $$

A daily $\sigma$ of 1% → annualized ~16%. Nifty's long-term annualized vol ~17–20%.

## Sharpe & friends

| Metric | Formula | Use |
|--------|---------|-----|
| **Sharpe** | $(R - R_f) / \sigma$ | Risk-adjusted return |
| **Sortino** | $(R - R_f) / \sigma_{downside}$ | Penalizes only downside vol |
| **Calmar** | $CAGR / |MaxDD|$ | Return per unit of drawdown |
| **MAR** | $CAGR / |MaxDD|$ (same as Calmar) | Used in CTA-land |
| **Information Ratio** | $(R_p - R_b) / \sigma(R_p - R_b)$ | Active return per unit of tracking error |
| **Omega** | Probability-weighted ratio of gains/losses above threshold | More complete than Sharpe |

> Sharpe **lies** when returns aren't normal. A strategy with high Sharpe and high negative skew (selling tail risk) looks great until the tail event. Always check distribution shape, not just Sharpe.

## Hypothesis testing — does my edge exist?

You backtest and get an avg trade return of +0.4% over 200 trades. Is this real or noise?

### t-statistic
$$ t = \frac{\bar{r}}{s / \sqrt{N}} $$

Where $\bar{r}$ is mean return, $s$ is std dev, $N$ is # trades.

- $|t| > 2$ → ~95% confident edge is real.
- $|t| > 3$ → ~99.7% confident.

For 200 trades with mean 0.4% and std 2%:
$$ t = \frac{0.4}{2 / \sqrt{200}} = \frac{0.4}{0.141} \approx 2.83 $$

> Real edges are often weak ($t \approx 2$). Spectacular t-stats (> 6) usually mean overfitting or look-ahead bias.

### Multiple-comparisons / data snooping correction

If you test 100 strategies, ~5 will appear significant at $p < 0.05$ **by random chance**. Use Bonferroni or Bayesian methods to adjust.

> This is why "I found this edge by trying 50 indicator combinations" is almost always overfit.

## Drawdowns — the real risk metric

A strategy with 30% CAGR and 50% drawdown is **untradeable** in practice. Most allocators (and humans) blow out at 20–30% drawdown.

- **Max DD** = worst peak-to-trough.
- **Average DD duration** = how long you spend underwater.
- **Recovery time** = peak → new peak. Often 2–5× the drawdown depth.

Plan capital and psychology around 2× your historical max DD. **What hasn't happened yet, will.**

## Expectancy & R-multiples

$$ E = (W \cdot A_w) - (L \cdot A_l) $$

Where $W$ is win rate, $A_w$ avg win in R, $L$ loss rate, $A_l$ avg loss in R.

A system with 40% win rate, avg win 3R, avg loss 1R:
$$ E = 0.4(3) - 0.6(1) = 1.2 - 0.6 = 0.6R \text{ per trade} $$

> Think in **R**, not rupees. R normalizes across position sizes and capital growth.

## Optimal position sizing — Kelly criterion

The mathematically optimal fraction of capital to risk per trade:

$$ f^* = \frac{p \cdot b - q}{b} $$

Where $p$ = win prob, $q = 1 - p$, $b$ = odds (avg win / avg loss).

Example: $p = 0.55$, $b = 1.5$:
$$ f^* = \frac{0.55 \times 1.5 - 0.45}{1.5} = \frac{0.825 - 0.45}{1.5} = 0.25 $$

Kelly says risk **25%** of capital per trade.

### Why nobody uses full Kelly
- Real-world $p$ and $b$ are estimated with error → Kelly is too aggressive.
- Drawdowns are huge (you can lose 50% on a normal sequence of bad luck).

**Practical:** use **¼ Kelly to ½ Kelly**. Or just stick with the 1% rule, which is roughly 1/10–1/20 Kelly for typical edges.

## Correlation & covariance

If you have 5 trades open and they're all in **bank stocks**, you don't have 5 trades — you have **one trade with 5 names**.

**Correlation** between two return series:
$$ \rho_{X,Y} = \frac{\text{Cov}(X, Y)}{\sigma_X \sigma_Y} \in [-1, +1] $$

Portfolio variance with multiple positions:
$$ \sigma_p^2 = \sum_i w_i^2 \sigma_i^2 + 2\sum_{i<j} w_i w_j \sigma_i \sigma_j \rho_{ij} $$

If $\rho = 1$, "diversification" gives nothing. If $\rho = 0$, two equal positions reduce vol by $\sqrt{2}$.

> In a crisis, **correlations spike to 1**. A "diversified" basket of cyclicals all crashes together. True diversification requires across-asset-class exposures (equity + bonds + gold + cash).

## Bayes' theorem — updating beliefs

$$ P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)} $$

Trading example: a setup historically wins 55%. Today RSI also gives a buy signal. Should you increase your conviction?

Only if **RSI confirmation is more frequent on winning trades than losing ones**. If RSI fires equally on winners and losers, it adds zero information regardless of how cool it looks.

> Ask: does this signal **change my probability of winning**, or does it just confirm what I already knew? If the latter, it's noise.

## Stationarity

A time series is **stationary** if its statistical properties (mean, variance, autocorrelation) are constant over time.

Most price series are **non-stationary** (they trend, vol changes). But **returns** are roughly stationary (if you squint).

For mean-reversion strategies (pairs, stat-arb), you need a **stationary spread** — verified with the **Augmented Dickey-Fuller (ADF)** test. We'll use this in [Stat Arb](02-stat-arb.md).

## Random walks vs trends

If returns are i.i.d. (independent and identically distributed), price is a **random walk** and prediction is impossible.

Empirically, equity prices show:
- **Short-term momentum** (1m–12m): trends persist (basis of momentum strategies).
- **Long-term reversal** (3y–5y): mean reversion (basis of contrarian/value).
- **Very short-term** (intraday): mostly noise + microstructure effects.

These are the **stylized facts** of equity returns. Any strategy implicitly bets on one of these. Know which one yours uses.
