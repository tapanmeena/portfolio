---
title: "Risk Management"
description: "This is the most important chapter in this guide. You cannot control profits; you can only control losses. Master this and you've already beaten 80% of retail."
tier: beginner
order: 7
source: "../TradingBot/docs/learn/07-risk-management.md"
---
# 6. Risk Management

This is the most important chapter in this guide. **You cannot control profits; you can only control losses.** Master this and you've already beaten 80% of retail.

## The cardinal rule: the 1% rule

> Never risk more than **1% of your total trading capital** on a single trade.

If your account is ₹1,00,000, your max loss per trade is **₹1,000**. Period.

Why? Math.

| Account drawdown | % gain needed to recover |
|------------------|-------------------------|
| 10% | 11% |
| 25% | 33% |
| 50% | 100% |
| 75% | 300% |
| 90% | 900% |

![Drawdown vs gain-needed-to-recover — the math of why losses are vicious](/trading-assets/learn/07/drawdown-recovery.png)

Look at how the right column **explodes** as the left column grows. The first row is forgiving — a 10% drawdown only needs an 11% gain to recover, almost symmetric. By a 50% drawdown you need to *double* what's left just to get back to even. By 75% you need to **quadruple**. By 90%, you need a tenfold return on a tiny remaining account. Almost no one in history has done that.

This is why every other rule in this chapter exists. Position sizing, stop-losses, daily loss limits — they're all just mechanisms to keep you on the *upper* rows of this table where recovery is possible. Once you slip down a few rows, the math itself starts working against you.

Big losses are **mathematically vicious**. A blown-up account is almost impossible to revive.

## Position sizing — the actual formula

$$ \text{Quantity} = \frac{\text{Capital} \times \text{Risk \%}}{|\text{Entry} - \text{Stop Loss}|} $$

### Example
- Capital: ₹1,00,000
- Risk per trade: 1% = ₹1,000
- Entry: ₹500
- Stop loss: ₹485 (₹15 risk per share)

$$ \text{Quantity} = \frac{1{,}000}{15} = 66 \text{ shares} $$

Total position size = 66 × ₹500 = **₹33,000** (33% of capital).

If the stop hits → you lose ₹990 (≤ 1% of capital). ✅

![Position sizing worked example — quantity derived from risk, not gut](/trading-assets/learn/07/position-sizing.png)

The diagram walks through the formula end-to-end. Start at the **inputs box on the left**: capital, risk %, entry, stop. Notice that the **risk per share** (₹15) falls out automatically once you decide entry and stop — you didn't pick it, the chart did. The **outputs box on the right** then divides total allowed loss (₹1,000) by per-share risk (₹15) to give the quantity (66 shares). Multiply by entry price and you get a position value of **₹33,000 — a third of your capital**, even though you're only risking 1%. That's the magic: by anchoring your sizing on *stop distance* rather than *position value*, you can take meaningful exposure on tight setups without ever risking more than your rules allow.

Flip the inputs around and try a wider stop (say ₹470 instead of ₹485): the formula gives you a smaller quantity, which keeps your max loss at ₹1,000. **The risk stays constant; the position size adapts.**

> **Notice:** Position size is *derived* from risk, not the other way around. Most beginners pick a quantity first, then "decide" the SL — backwards.

## Risk : Reward (R:R)

Always know your R:R *before* entering.

- **Risk** = entry − stop (per share)
- **Reward** = target − entry (per share)
- Aim for **minimum 1:2**, prefer **1:3** or better.

![A 1 : 3 risk-reward setup with entry, stop and target marked](/trading-assets/learn/07/risk-reward.png)

The chart visualizes a 1:3 trade. The **blue dashed line** in the middle is your entry at ₹500. Below it, the **red zone** is the small slice of price action between entry and your stop at ₹485 — ₹15 of risk per share, equal to **1R**. Above entry, the **much bigger green zone** stretches all the way up to your target at ₹545 — ₹45 per share, **3R**. The right-side bracket makes the asymmetry visual: the green strip is three times as tall as the red strip.

This is what "good R:R" looks like before you take a trade. If you can't draw a target on the chart that gives you at least 2 such green strips for every red one, the setup isn't worth your bullets. The price path drawn in blue is one way the trade could play out (a small dip toward stop, then a smooth grind to target) — but the **plan** is set the moment you draw those three horizontal lines, not after the fact.

### Why 1:2 minimum?
With 1:2 R:R, you only need to win **34%** of trades to break even. With 1:1, you need 50%. With 1:0.5 (most retail trades), you need 67% — which almost no one achieves consistently.

## Stop loss — non-negotiable

Three ways to set a stop:

1. **Structure-based** — below recent swing low / support. **Best in most cases.**
2. **Volatility-based** — 1.5× to 2× ATR. Adapts to the stock.
3. **% based** — fixed % (e.g., 2%). Naive, ignores the stock's character.

> **Never move a stop *farther* from entry to "give it room."** Moving stops *closer* (trailing) is fine. Moving them away is denial.

## Trailing stop-loss

As price moves in your favor, **drag the stop along** to lock in profit. Methods:
- Below each new swing low (uptrend).
- Below the Supertrend line.
- Chandelier exit: highest high − 3× ATR.
- Below a key MA (e.g., 20 EMA).

This is exactly what **StalkMarket** automates — see the project's [DESIGN.md](../../DESIGN.md).

## Diversification (within reason)

- Don't put 100% in one stock or one sector.
- 5–10 positions is a sweet spot for active traders. >20 = you're an index fund.
- Correlation matters: 5 banks ≠ diversified.

## Maximum portfolio risk

Open trades have *combined* risk. Cap it:
- **Total open risk ≤ 5%** of capital.
- That means at most ~5 simultaneous trades at 1% each.

## Daily / weekly loss limits

Set a circuit breaker on yourself:
- **Daily stop:** if you lose 3% in a day → stop trading, close laptop.
- **Weekly stop:** lose 6% in a week → take the rest of the week off.

This prevents tilt and revenge trading (covered in [Psychology](09-psychology.md)).

## Don't average a loser

Adding to a losing position to "lower your average" is the #1 account killer. The market doesn't care about your average price. If your stop hit, you were wrong — exit and reassess.

> Adding to **winners** (pyramiding) is a different and valid technique.

## Trade journal

Track every trade:
- Date, symbol, direction
- Entry, SL, target, exit
- Quantity, P&L, R multiple
- **Reason for entry** (which setup)
- **What you did right / wrong**

Review weekly. Patterns emerge — you'll find your *actual* edge (and your leaks).

## A complete pre-trade checklist

Before clicking buy, all 7 must pass:

- [ ] Trend on higher TF aligns with my direction
- [ ] Setup is one of my pre-defined patterns (not a random idea)
- [ ] Entry, SL, and target are written down
- [ ] R:R ≥ 1:2
- [ ] Position size = (capital × 1%) ÷ (entry − SL)
- [ ] Total open portfolio risk after this trade ≤ 5%
- [ ] I haven't hit my daily loss limit

If even one fails — **skip the trade**. There will be another.
