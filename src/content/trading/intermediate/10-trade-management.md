---
title: "Trade Management"
description: "Entries and exits get the glory; management is where most of the P&L is decided. The same setup, managed two different ways, can yield very different results."
tier: intermediate
order: 10
source: "../TradingBot/docs/intermediate/10-trade-management.md"
---
# 10. Trade Management

Entries and exits get the glory; **management is where most of the P&L is decided**. The same setup, managed two different ways, can yield very different results.

## The lifecycle of a trade

```
Plan → Entry → In-Trade Management → Exit → Review
```

Each phase has its own rules. Most beginners obsess over entries; pros obsess over **management**.

## Scaling in (pyramiding)

Adding to a position **as it works**, not as it loses.

### When it makes sense
- Strong trend following systems.
- High-conviction breakouts that confirm.
- You have proper risk control on the combined position.

### How to scale in (correctly)
- **First entry:** 50% of intended size at the trigger.
- **Add #1:** another 25% on confirmation (e.g., next swing high taken out).
- **Add #2:** final 25% on continued strength.
- **Move stop up** with each add — the average price rises but so does the stop.

### What NOT to do
- **Averaging down** (adding to losers) — this is the path to ruin.
- Adding without moving the stop — your risk balloons silently.

## Scaling out (taking partials)

Closing pieces of the position at predetermined points to **lock in profit while keeping upside**.

### Common pattern: the "1/3, 1/3, 1/3"
- **At 1R:** sell 1/3, move stop to breakeven. (Trade is now risk-free.)
- **At 2R:** sell another 1/3.
- **Trail the rest** with a wide stop and let it ride.

### Pros
- Reduces emotional pressure (locked-in win).
- Captures both swing moves and runners.
- Smooths equity curve.

### Cons
- Caps total upside.
- More commissions.
- Harder to backtest cleanly.

> Whether to scale out is style-dependent. Trend-followers often **don't** — they let the full position ride and trail. Swing/intraday traders often **do**.

## Moving the stop — the breakeven question

Once a trade moves into profit:

| Profit | Action |
|--------|--------|
| < 0.5R | Original stop |
| 0.5R – 1R | Tighten slightly (e.g., to halfway) |
| 1R | **Move to breakeven** |
| > 1R | Trail (swing-low / EMA / Supertrend / chandelier) |

> "**Never let a winner turn into a loser.**" Once price hits 1R, your stop should never be below entry again. This single rule separates positive-EV traders from breakeven ones.

## Trailing stop methods (revisited, deeper)

| Method | How it works | Best for |
|--------|--------------|----------|
| **Swing-low trail** | Move stop below each new swing low | Discretionary swing |
| **Moving average trail** | Stop = below 10/20 EMA on close | Smooth trends |
| **Chandelier exit** | HighestHigh(N) − k × ATR(N) | Trend following |
| **Supertrend** | Built-in (ATR-based) | Mechanical systems |
| **Parabolic SAR** | Tightening stop curve | Strong trends, prone to whipsaw |
| **Fixed % trail** | Trail at fixed % below highest close | Simple, suboptimal |

**Tradeoff:** Tighter trails = lock more profit but get stopped earlier. Wider trails = catch bigger moves but give back more.

> Backtest your trail. The right multiplier depends on the stock's volatility regime. StalkMarket's trailing strategy is configurable per-stock for exactly this reason.

## Time stops

If a trade hasn't moved in N bars, exit. The opportunity cost of dead capital matters.

### Examples
- Intraday: 60 minutes with no progress → close.
- Swing: 5 bars (days) with no progress → close.
- Positional: 4 weeks with no movement → reassess.

A trade that **doesn't work quickly often doesn't work at all**. Time stops free up capital for better setups.

## Re-entry rules

You stopped out; the trade re-triggers. Do you re-enter?

- **Yes, with smaller size.** The original setup is still valid, but you've already paid for one stop.
- **Cap re-entries** (e.g., max 2 attempts per stock per setup).
- After 2 failed entries → **the chart is telling you something**. Walk away.

## Hedging an open position

Big position, big news risk overnight, want to stay in but reduce risk?

- **Buy puts** on the stock (or index) — limits downside, costs premium.
- **Short the index future** (partial hedge against systemic risk).
- **Sell covered calls** — generates income, caps upside.

For most retail trades, hedging is overkill. Use it only on large, conviction long-term holds.

## Managing winners through events

You're long with 3R profit. Earnings tomorrow. What now?

Options:
1. **Close everything** — guaranteed profit, no event risk. (Conservative)
2. **Sell 50%, leave 50% with breakeven stop** — balanced.
3. **Hold all + buy a hedge put** — keeps upside, caps downside, costs premium.
4. **Hold and hope** — gambling. Avoid.

Default for most traders: option 2. Take chips off the table; let the rest ride.

## Position scaling by conviction

Not every trade should be the same size. Tier your conviction:

| Conviction | Position size |
|------------|---------------|
| A++ — perfect setup, all alignments | 1.5% risk |
| A — standard high-quality setup | 1.0% risk |
| B — decent setup, some flaws | 0.5% risk |
| C — speculative / experimental | 0.25% risk |

> **Important:** This isn't about "feeling good" — it's about pre-defined criteria. "I really like this one" is not a conviction tier.

## The trade journal — what to log per trade

| Field | Notes |
|-------|-------|
| Date, symbol, direction | |
| Setup name | (one of your pre-defined setups) |
| Conviction tier | A++/A/B/C |
| Entry, SL, target | Planned |
| Quantity, capital risked | |
| Actual entry, exit, P&L (in ₹ and R) | |
| Adherence to plan? | Y/N + notes |
| What went right | |
| What went wrong | |
| Screenshot | Entry chart + exit chart |

Review weekly. After 100+ trades, patterns emerge:
- Your **best setup** by win rate × avg R.
- Your **worst time of day**.
- Your **most expensive mistake** (almost always: not following the plan).

## The Trade Adherence Score

Rate yourself out of 10 on plan adherence per trade:
- Did you size correctly? (2 pts)
- Did you respect your stop? (3 pts)
- Did you respect your target / trail rule? (3 pts)
- Did you trade only your defined setup? (2 pts)

**Track average adherence score over time.** This is your real metric — not P&L. P&L will follow if adherence is high.

## A complete intermediate trade example

**Setup:** Daily breakout from 20-day high in Bank Nifty member, RVOL > 2.

**Plan:**
- Universe: Nifty Bank constituents only.
- Entry: SL-M order at 20-day high + ₹2 buffer.
- SL: Below the breakout day's low.
- Initial size: 1% capital risk.
- **Management:**
  - At 1R: sell 33%, move stop to breakeven.
  - At 2R: sell another 33%.
  - Trail rest with 10 EMA on daily close.
- Time stop: exit if no progress in 8 bars.
- Re-entry: max 1 retry within 5 days.

**Execution journal:** entry, partial exits, trail moves, final exit — all logged with screenshots.

**Review:** every Sunday, last week's trades reviewed for adherence and outcomes.

This kind of disciplined, systematized management is what separates the 5% who make money from the 95% who don't.
