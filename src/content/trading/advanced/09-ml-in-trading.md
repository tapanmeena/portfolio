---
title: "Machine Learning in Trading"
description: "A measured, honest take. ML is not magic for trading. It is a tool that, used wrong, will overfit you into bankruptcy faster than any indicator combination. Used right, it adds …"
tier: advanced
order: 9
source: "../TradingBot/docs/advanced/09-ml-in-trading.md"
---
# 9. Machine Learning in Trading

A measured, honest take. ML is **not magic** for trading. It is a tool that, used wrong, will overfit you into bankruptcy faster than any indicator combination. Used right, it adds modest, hard-won edges in specific niches.

> 95% of "AI trading" content online is selling courses. The remaining 5% works at quant funds and doesn't post on YouTube.

## What ML can do well in trading

- **Feature combination** — combine many weak signals into a slightly less weak composite (boosted trees especially).
- **Non-linear relationships** — capture interactions hand-crafted rules miss.
- **Regime classification** — clustering / HMMs to detect market state.
- **NLP for alt data** — news sentiment, earnings call transcripts.
- **Volatility & risk modeling** — predicting realized vol, tail risk.
- **Order book modeling** — short-horizon price prediction in HFT.

## What ML usually fails at

- **Predicting price direction from price alone** — efficient markets ate that lunch decades ago.
- **Long-horizon forecasting** — too much noise, regime changes invalidate models.
- **Deep learning on small data** — equity history per stock is not "big data" by ML standards.
- **Strategies without an economic rationale** — pure pattern matching is overfitting in disguise.

## The fundamental challenge: signal-to-noise ratio

Most price prediction tasks have **SNR ≈ 0.01–0.05**. Compare to:
- Image classification: SNR > 1.
- Speech recognition: SNR > 0.5.

ML excels when patterns are strong. In trading, even a 51% accuracy on directional prediction is **legendary** — and almost impossible to validate honestly.

## Why naive ML overfits catastrophically

You build a model:
- Features: 20 technical indicators
- Target: tomorrow's return > 0
- Model: XGBoost, 500 trees
- Data: 5 years of daily Nifty 50

Backtest: 65% accuracy! Sharpe 3! 200% CAGR!

**Reality:** Look-ahead bias, label leakage, train-test contamination, and survivorship bias inflated everything. Live performance: random.

## Doing ML right — the rules

### 1. Have an economic hypothesis FIRST
Don't fit models hoping to find something. Start with: *"Stocks with X behavior tend to do Y because Z."* Then test if ML can capture X→Y better than rules can.

### 2. Use cross-validation that respects time
**No standard k-fold.** Use:
- **Walk-forward CV** — train on 2018–2020, test 2021. Train on 2018–2021, test 2022. Etc.
- **Purged & embargoed CV** (Marcos López de Prado) — leave gaps between train/test to prevent leakage.

### 3. Sample correctly
Don't use overlapping labels (e.g., "5-day forward return" computed on every day → samples overlap). Either:
- Use non-overlapping windows.
- Use **triple barrier method** + sample weighting (López de Prado).

### 4. Beware label leakage
- Don't normalize features using the full dataset (use only past data).
- Don't include the target's components in features.
- Don't use features computed *forward in time* (e.g., "future 5-day vol" as a feature is a classic mistake).

### 5. Choose simple models first
Start with: linear/logistic regression, then random forest, then gradient boosting. **Skip deep learning unless you have a specific reason** — it's harder to debug, easier to overfit, and rarely outperforms tree models on tabular financial data.

### 6. Calibrate probabilities
Most classifiers output uncalibrated scores. Use Platt scaling or isotonic regression to get true probabilities. Important for sizing.

### 7. Measure what matters
Accuracy is meaningless. Use:
- **Sharpe of the strategy built from predictions.**
- **AUC on out-of-sample.**
- **PnL per prediction confidence bucket.**
- **Stability of feature importances** across CV folds.

## Feature engineering — where edge actually comes from

The model is the easy part. **Features make or break ML strategies.**

Categories:

### Price-based
- Log returns at multiple horizons (1d, 5d, 20d).
- Volatility (realized at multiple windows).
- Rank features (RSI percentile, return percentile).
- **Avoid raw prices** — they're non-stationary.

### Volume / order flow
- Volume z-score, RVOL.
- Price-volume divergence.
- Order book imbalance (bid qty − ask qty / total).

### Cross-sectional
- Stock's return vs sector.
- Stock's return vs index.
- Rank within universe.

### Macro / regime
- VIX level / percentile.
- Yield curve slope.
- USD/INR change.
- Crude price change.

### Alternative data
- News sentiment (NLP on news headlines).
- Twitter/X sentiment (very noisy, mixed evidence).
- Insider trading filings.
- Web traffic, satellite data (institutional only).
- Earnings call transcript embeddings.

### Engineered transforms
- Z-score normalization (with **expanding** window, not full-data).
- Lagged values.
- Rolling correlations.
- Fractionally differentiated series (preserves memory while making stationary).

## A realistic ML workflow

```
1. Hypothesis: "Earnings surprises in mid-cap pharma trigger 5-day momentum."
2. Build dataset: features X, labels y (5-day forward return).
3. Walk-forward train/test split.
4. Baseline: simple rule (long if surprise > 5%). Sharpe 0.4.
5. ML model: gradient boosting on 30 features. Sharpe 0.7.
6. Out-of-sample: Sharpe 0.45 (significant degradation but still > baseline).
7. Validate stability across folds.
8. Build live strategy with conservative sizing.
9. Forward test 6 months.
10. Deploy small. Monitor for degradation.
```

Notice:
- The improvement is **modest**, not "10x."
- ML beats baseline but doesn't crush it.
- Real-world Sharpe is **half** of in-sample.
- This is **success.**

## Reinforcement learning

Hot topic, mostly hype for trading.

- Issues: reward sparsity, distributional shift, sample inefficiency.
- Works in narrow domains (market making, optimal execution).
- Generally worse than well-designed supervised models for directional trading.
- Don't start here.

## Deep learning specifically

LSTMs, transformers, etc. on price data:

- **Almost always overfits** without massive regularization.
- Underperforms gradient-boosted trees on most tabular financial tasks.
- Useful for **sequence/text** problems (NLP on news, earnings calls).
- Useful in **HFT order book modeling** with billions of samples.

For retail/swing trading: skip deep learning.

## Ensemble approaches

Combine N models, each capturing different aspects:
- A trend model.
- A mean-reversion model.
- A vol model.

**Average their predictions** (or use a meta-model). Often more robust than any single model.

## Online learning & model decay

Markets change. A model trained on 2020–2022 will degrade by 2025.

Strategies:
- **Periodic retraining** (monthly / quarterly).
- **Online learning** (continuous adaptation).
- **Performance monitoring** with degradation alerts → retrain trigger.

> Even after deployment, your model's edge is **temporary**. Plan for refresh and replacement.

## Tooling

- **Python**: scikit-learn, XGBoost, LightGBM, Optuna for tuning.
- **Pandas, Polars** for data.
- **mlfinlab** (López de Prado's library) — proper CV, sample weights, fractional differentiation.
- **MLflow** for experiment tracking.
- **TimescaleDB / DuckDB** for storing features and labels.

## Reading list (quality > quantity)

- *Advances in Financial Machine Learning* — Marcos López de Prado. **The book.** Read it.
- *Machine Learning for Asset Managers* — López de Prado (shorter follow-up).
- *Empirical Asset Pricing via Machine Learning* — Gu, Kelly, Xiu (academic, important).
- Avoid most "AI trading" books on Amazon — typically shallow + outdated.

## A final honest take

For 99% of retail traders, **ML is the wrong place to spend time.** Better edge comes from:

1. **Risk management.** (1% rule alone outperforms most ML "edges.")
2. **Strategy diversification.**
3. **Execution quality.**
4. **Psychology and discipline.**
5. **Patience and capital preservation.**

Only after these are mastered does ML offer marginal incremental edge — and even then, **classical statistics + boosted trees** does the heavy lifting. Save deep learning for when you've already won using simpler tools.
