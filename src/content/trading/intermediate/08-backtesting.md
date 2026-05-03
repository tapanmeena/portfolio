---
title: "Backtesting Properly"
description: "\"There are lies, damned lies, and backtests.\""
tier: intermediate
order: 8
source: "../TradingBot/docs/intermediate/08-backtesting.md"
---
# 8. Backtesting Properly

> "There are lies, damned lies, and backtests."

A backtest run carelessly will tell you anything you want to hear. Done correctly, it's the most powerful tool a serious trader has.

## What backtesting is — and isn't

**Is:** A simulation of your rules on historical data to estimate edge, drawdown, and consistency.

**Isn't:** A guarantee of future performance. Markets evolve; edges decay.

Goal: gain **statistical confidence** that your idea has positive expectancy *before* risking capital.

## The 7 deadly sins of backtesting

### 1. Look-ahead bias
Using information that wasn't available at the time of the trade.

**Example:** Filtering for "stocks that *closed* above 50 SMA" and trading them at the same day's open. You'd need to know the close before the open. Trade the *next* day's open.

### 2. Survivorship bias
Backtesting only on **today's universe** ignores delisted/bankrupt stocks. Most "buy and hold the Nifty 50" backtests are inflated because today's Nifty 50 is the survivors.

**Fix:** Use a point-in-time universe (the actual constituents on each historical date).

### 3. Overfitting / curve fitting
Tweaking parameters until the backtest looks beautiful. RSI(13), close > EMA(47), only Tuesdays — your "edge" is noise.

**Fix:**
- Use **few parameters** (≤ 3).
- Test on **out-of-sample** data (split your history).
- Use **walk-forward** analysis.

### 4. Ignoring costs
Brokerage, STT, slippage, taxes — all real. A strategy with 0.05% edge per trade dies after costs.

**Fix:** Add **realistic** transaction costs (≥ 0.1% round-trip for equity, more for low-liquidity stocks). Model **slippage** as 0.1–0.3% on market orders.

### 5. Position sizing fantasy
"What if I'd bought 1,000 shares?" — but you only had ₹2 lakh. Use **realistic** sizing tied to actual capital and risk %.

### 6. Selection bias
"My strategy works on Reliance, Infy, and HDFC Bank!" — yes, because you cherry-picked them after seeing the data.

**Fix:** Test on the **entire** liquid universe, not 5 favorites.

### 7. Cherry-picking timeframes
Picking the 3-year window where the strategy worked. Test across **multiple regimes** (2008–2009 bear, 2010–2014 sideways, 2014–2020 bull, 2020 crash, 2020–2024 recovery, 2024 sideways).

## A proper backtest workflow

### Step 1: Data
- Get **clean, adjusted** OHLCV data (split & dividend adjusted).
- Source: Yahoo Finance, NSE Bhavcopy, Kite Connect historical, paid (Truedata, GFDL).
- Validate: spot-check vs charts, look for missing days, weird zeros.

### Step 2: Define rules unambiguously
Pseudocode it. Every condition explicit. No "use judgment here."

```python
# Entry
if (close > sma_50) and (close > sma_200) and (rsi_14 crosses above 50):
    enter_long(at=next_open, size=risk_pct(0.01))
    set_stop(at=lowest_low_5)
    set_target(at=2 * (entry - stop) + entry)

# Exit
if price hits stop or target or 20 bars elapsed:
    exit()
```

### Step 3: Train / Test split
- **In-sample (IS)** — 70% of data. Develop and tune.
- **Out-of-sample (OOS)** — 30% of data. Test once. Don't peek during development.

If OOS performance ≪ IS, you overfit. Throw it out.

### Step 4: Walk-forward analysis
A more robust version of train/test:

```
Train Jan 2018 – Dec 2019  → Test Jan 2020 – Jun 2020
Train Jul 2018 – Jun 2020  → Test Jul 2020 – Dec 2020
Train Jan 2019 – Dec 2020  → Test Jan 2021 – Jun 2021
... etc
```

Concatenate the OOS test results. This is the closest simulation to live trading.

### Step 5: Compute the right metrics
Don't just look at total return.

| Metric | What it tells you | Good range |
|--------|-------------------|------------|
| **CAGR** | Annualized return | > index + 5% |
| **Max Drawdown (MDD)** | Worst peak-to-trough | < 25% |
| **Sharpe Ratio** | Return per unit of volatility | > 1 (good), > 2 (great) |
| **Sortino Ratio** | Return per unit of *downside* vol | > 1.5 |
| **Calmar Ratio** | CAGR / MDD | > 1 |
| **Win rate** | % winning trades | Strategy-dependent |
| **Avg win / Avg loss** | Payoff ratio | > 1.5 for low win-rate systems |
| **Expectancy / trade** | (Win% × AvgWin) − (Loss% × AvgLoss) | > 0 after costs |
| **Max consecutive losses** | Worst losing streak | Affects psychology |
| **# trades** | Sample size | ≥ 100 (statistical validity) |

### Step 6: Stress test
- **Monte Carlo:** Shuffle trade sequence 10,000 times. Distribution of outcomes.
- **Parameter sensitivity:** Vary key params ±20%. Strategy should still be profitable. If perf collapses → overfit.
- **Regime breakdown:** Plot equity curve by year and by market regime. Look for hidden weakness.

### Step 7: Forward / paper test
A passing backtest earns the **right** to be paper-traded. Run it live (no real money) for 2–3 months. Compare to backtest expectations. If reality matches → consider going live with **small** capital.

## Typical pitfalls in Indian markets

- **Bonus / split adjustments** — using unadjusted data wrecks long-term backtests.
- **Circuit limits** — a stock may "show" a price but be untradable (locked in upper/lower circuit).
- **Holiday calendar** — NSE-specific holidays.
- **F&O rollovers** — handle expiry and contract changes carefully.
- **Brokerage tier changes** — Indian brokerage went from %-based to ₹20 flat in 2015. Older backtests need realistic cost models.

## Tools for backtesting

| Tool | Type | Notes |
|------|------|-------|
| **Backtrader** (Python) | Event-driven | Mature, flexible, free |
| **VectorBT** (Python) | Vectorized | Very fast, good for parameter sweeps |
| **Zipline** (Python) | Event-driven | Originally Quantopian's, now community |
| **TradingView** | Pine Script | Easy, but limited (no proper position sizing in basic) |
| **Amibroker** | AFL | Indian retail favorite, fast, paid |
| **MetaTrader 5** | MQL | Forex/CFDs primarily |
| **Custom (DuckDB + pandas)** | DIY | Maximum control |

## A sanity-check rule

If a strategy shows:
- 80% win rate
- 5+ Sharpe
- Drawdown < 5%
- 200% annualized return

…it is **almost certainly overfit, look-ahead biased, or a bug.** Real, tradeable edges look modest: 50–60% win rate, Sharpe 1–2, drawdown 15–25%, CAGR a respectable percent above the index.

Modesty in backtest results is a sign of honesty.
