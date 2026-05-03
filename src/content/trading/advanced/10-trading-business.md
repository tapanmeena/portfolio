---
title: "Running a Trading Business"
description: "The leap from \"trader\" to \"trading business\" is operational, legal, and psychological. This chapter covers the unsexy stuff that determines whether you survive year 5 — capital …"
tier: advanced
order: 10
source: "../TradingBot/docs/advanced/10-trading-business.md"
---
# 10. Running a Trading Business

The leap from "trader" to "trading business" is operational, legal, and psychological. This chapter covers the unsexy stuff that determines whether you survive year 5 — capital allocation, taxes, structure, and scaling.

## Are you a trader or a hobbyist?

Honest signals you've crossed the threshold:

- Trading **income exceeds salary** (or comparable).
- You spend > 4 hours/day on markets, daily.
- You have systems, processes, journals, monitoring.
- You file taxes as a trader, not as a casual investor.
- You think in **CAGR / Sharpe**, not "how much I made this month."

If yes → run it like a business. If no → don't pretend; keep your day job.

## Capital allocation tiers

Not all your money belongs in one trading account.

| Bucket | Purpose | Typical % |
|--------|---------|-----------|
| **Emergency fund** | 6–12 months of expenses, liquid (FD, savings) | First priority |
| **Long-term invest** | Index funds, retirement, untouchable | 30–60% of net worth |
| **Trading capital** | Active risk capital | 20–40% of net worth |
| **Reserve** | Cash for opportunities, drawdowns, top-ups | 10–20% of trading account |

> Never trade with money you need within the next 5 years. Drawdowns happen. Forced liquidations at the bottom kill trading careers.

## Withdrawals — pay yourself

A common error: leaving all profits in the trading account.

Better:
- Set a **monthly/quarterly withdrawal**: e.g., 40% of profits to personal account.
- Reinvest the remaining 60% to compound capital.
- Withdrawals create real wealth (and avoid the "paper rich, life poor" trap).

For pros: structure as **salary + bonus** to yourself if running through a company.

## Taxation in India (high-level)

> ⚠️ Tax law changes. Always confirm with a CA. This is a starting framework as of FY 2025–26.

### Equity classifications

| Income type | Holding period | Tax |
|-------------|---------------|-----|
| **STCG** (short-term capital gain) | < 12 months | 20% (post-Budget 2024) |
| **LTCG** (long-term) | ≥ 12 months | 12.5% above ₹1.25L exempt/year |
| **Intraday equity** | Same-day | **Speculative business income** — slab rate |
| **F&O** | Any | **Non-speculative business income** — slab rate |
| **Dividend** | — | Slab rate (TDS at 10% if > ₹5K) |

### Why F&O = "business" matters

- File **ITR-3**, not ITR-2.
- Losses can offset other business income, carry forward 8 years (vs 8 for STCG too, but business losses set off broader).
- **Audit required** (Sec 44AB) if turnover > ₹10 cr (presumptive scheme available below).
- Expenses deductible: broker fees, internet, depreciation on computer, books, advisory.

### Turnover for F&O
For tax: turnover = sum of **absolute P&L** + sum of premium received on options sold. (Yes, that small clarification matters for audit thresholds.)

### STT / CTT / Stamp / GST
Already deducted by broker. Track them — STT paid is a cost, not separately deductible in most cases.

### Maintain books
For F&O / intraday: bookkeeping is mandatory. Use Quicko, Cleartax, or a CA. Reconcile monthly with broker statements.

### Advance tax
If tax liability > ₹10K → pay quarterly (Jun 15, Sep 15, Dec 15, Mar 15). Penalties for short-payment. Trading income is volatile → over-pay slightly to be safe.

## Legal structures

### Individual / HUF (default)
- Simple, no extra cost.
- Income added to your personal slab.
- **Best for most retail traders** (< ₹1 cr/year scale).

### Sole proprietorship
- Same as individual for tax.
- Useful for branding (e.g., business name, separate bank account).

### Partnership / LLP
- Multiple partners, profit sharing.
- LLP has limited liability + simpler compliance than Pvt Ltd.

### Private limited company
- Corporate tax (~25% effective).
- Useful when scaling, hiring, or pooling capital.
- Higher compliance cost.
- Loss offset rules different (can't set off vs personal income).

### PMS / AIF (managing others' money)
- **PMS license** (SEBI) requires ₹5 cr net worth + experience + manager registration.
- Min client investment: ₹50 lakh.
- **AIF (Cat III)** for hedge-fund-style strategies — ₹20 cr corpus minimum, more flexibility.

> **Don't manage other people's money without proper license.** SEBI penalties and reputational damage are severe. Friends-and-family pooling is a legal grey zone — get a lawyer.

## Insurance & buffers

- **Health insurance** — non-negotiable. Trading income is not predictable; one major medical event without coverage destroys the trading business.
- **Term life insurance** — if you have dependents.
- **Disability insurance** — your livelihood is your screen + you. Both can break.
- **Capital buffer** — 12+ months expenses in non-trading liquid assets.

## Benchmarks — measuring yourself

Track your trading vs:
- **Nifty 50 TR (Total Return)** — includes dividends.
- **Nifty 500 TR** — broader.
- **Risk-free rate** (~7% repo or G-Sec yield).
- **A simple 50/50 equity/debt portfolio.**

If you can't beat Nifty 500 TR + 5% over 3 years on a risk-adjusted basis, **passive investing is better.** Honest self-assessment annually.

## Scaling capital

Adding capital is non-trivial:

- A strategy that works on ₹10L may fail on ₹1 cr (slippage, capacity limits).
- **Test scaling gradually** — double capital, monitor for 3 months, then double again.
- **Some strategies have hard capacity limits** (e.g., small-cap momentum: ~₹50L–₹2 cr).
- Diversify across strategies as capital grows — single-strategy concentration is risky.

> Don't grow capital faster than your psychological tolerance. Going from ₹10L to ₹1 cr in size means losses are 10× larger in absolute terms. Many traders break here.

## The operating cadence

A daily/weekly/monthly/annual rhythm:

### Daily (15–30 min)
- Pre-market routine (news, watchlist, levels).
- Trade execution per plan.
- End-of-day journal entries.

### Weekly (1–2 hr, Sunday)
- Review trades from past week.
- Update trade adherence score.
- Refresh watchlists & sector RS rankings.
- Check macro calendar for week ahead.

### Monthly (2–4 hr)
- P&L breakdown by strategy.
- Review drawdown vs limits.
- Reconcile broker statement with personal books.
- Pay advance tax if quarter-end.
- Withdraw planned profit to personal account.

### Quarterly (1 day)
- Strategy attribution analysis.
- Retrain ML models / re-test parameters.
- Capacity review — should I scale up/down?
- Tax-loss harvesting opportunities.

### Annually (2–3 days)
- Full strategy review — kill underperformers.
- Tax filing (ITR-3 with audit if needed).
- Re-evaluate legal structure.
- Set goals for next year (CAGR, Sharpe, max DD).
- Update insurance, emergency fund.

## Red flags to watch in yourself

- You **stop journaling**.
- You **trade more after losses** (revenge).
- You **stop reviewing** trades.
- You **trade outside your defined system** ("just this once").
- Your **family complains** about your screen time / mood.
- You **borrow** to trade.
- You **lie about losses** (to spouse, to tax, to yourself).

Any one of these = pause. Reset. Talk to someone. Trading is a **long game** that punishes ego ruthlessly.

## When to quit (or pivot)

- Sustained 2+ years of underperformance vs benchmarks.
- Drawdown deeper than your max tolerance (psychological & financial).
- Your edge has evaporated and you can't find a new one despite serious effort.
- The opportunity cost of your time exceeds trading income (a pro could earn more in a job).
- Health, relationships, or general well-being suffer.

There's no shame in pivoting to passive investing or returning to a salaried role. **The market doesn't owe you a career.** Many who tried, paused, and returned later did better than those who white-knuckled through.

## Final principles

1. **Capital preservation first.** Returns second. Profits third.
2. **Process over outcomes** — every day, every week, every year.
3. **Optimize for sustainability** — Sharpe, drawdown, sleep — not max CAGR.
4. **Diversify income** — early in the journey, keep other income streams.
5. **Stay humble** — the market humbles every great trader eventually.
6. **Never stop learning** — markets evolve; you must too.
7. **Health > wealth** — burnout breaks careers more than drawdowns.

> "The market can remain irrational longer than you can remain solvent." — Keynes
>
> "Survival is the only road to riches." — Peter L. Bernstein
>
> "First rule of compounding: never interrupt it unnecessarily." — Charlie Munger

🎓 **You've reached the end of the curriculum.** From here, the only teacher is the market. Trade small, think long, journal everything, stay curious. Good luck.
