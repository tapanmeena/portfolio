---
title: "Options Basics"
description: "An option is the right (not obligation) to buy or sell an asset at a fixed price by a fixed date. You pay a premium for this right."
tier: intermediate
order: 3
source: "../TradingBot/docs/intermediate/03-options-basics.md"
---
# 3. Options Basics

An **option** is the *right* (not obligation) to buy or sell an asset at a fixed price by a fixed date. You pay a **premium** for this right.

> Most retail option traders lose money because they treat options like lottery tickets. We won't.

## Two types

| Option | Right to | Used by buyer when bullish/bearish? |
|--------|----------|-------------------------------------|
| **Call (CE)** | Buy the underlying | Bullish |
| **Put (PE)** | Sell the underlying | Bearish |

## Anatomy of an option

- **Strike price (K)** — the price at which you have the right to transact.
- **Expiry** — when the right vanishes.
- **Premium** — what you pay/receive.
- **Lot size** — same as futures.
- **Style** — Indian index/stock options are **European** (exercise only at expiry).

### Example
**Nifty 24500 CE June expiry @ ₹150 premium**
- Right to "buy" Nifty at 24,500.
- Premium ₹150 × lot 25 = ₹3,750 paid.
- At expiry, if Nifty = 24,800: intrinsic value = 300, profit = 300 − 150 = ₹150/share = ₹3,750.
- If Nifty ≤ 24,500 at expiry: option expires worthless. **You lose the entire ₹3,750.**

## Moneyness

| For a Call | For a Put | Term |
|------------|-----------|------|
| Spot > Strike | Spot < Strike | **ITM** (In-The-Money) — has intrinsic value |
| Spot ≈ Strike | Spot ≈ Strike | **ATM** (At-The-Money) |
| Spot < Strike | Spot > Strike | **OTM** (Out-of-The-Money) — only time value |

![Moneyness table for a stock at ₹500 — ITM / ATM / OTM strikes for calls and puts](/trading-assets/intermediate/03/moneyness.png)

With spot at ₹500, scan the table top-to-bottom. The **green ITM cells** mark strikes where the option already has *real value* baked in: a 460 Call lets you "buy at ₹460" when the market price is ₹500 — that's a guaranteed ₹40 of intrinsic value, plus whatever extra time value the market layers on top. Mirror image for puts on the bottom rows. The **amber ATM row** at strike 500 is the indecision zone — both call and put have zero intrinsic value, so the *entire* premium is time value (the market betting on which way it'll move). The **red OTM cells** are pure lottery tickets — strikes too far away to be worth anything intrinsically yet, just hope and time decay.

When you read an option chain, this picture is what you're navigating: ITM = expensive but high probability, ATM = balanced, OTM = cheap but most likely to expire worthless.

## Intrinsic vs Time value

$$ \text{Premium} = \text{Intrinsic Value} + \text{Time Value} $$

- **Intrinsic** = how deep ITM (max(0, S−K) for calls, max(0, K−S) for puts).
- **Time value** = the rest. Decays as expiry nears (**theta decay**).

### Why OTM options "feel cheap" but are usually losing trades
A 24,800 CE when Nifty is at 24,500 might cost just ₹40. But for it to be profitable, Nifty must rally 1.4% AND that move must happen before time value erodes. Probability < 30%. Most expire worthless.

## Buying vs selling options

| | Buyer | Seller (writer) |
|---|------|-----------------|
| Pays | Premium | Receives premium |
| Risk | Limited to premium | **Potentially unlimited** (calls) |
| Reward | Unlimited (theoretically) | Limited to premium |
| Margin | Just the premium | Full SPAN + Exposure |
| Time decay | Hurts you | Helps you |
| Win rate | Low (~30–35%) | High (~65–75%) |

**Reality check:** ~80–90% of option *buyers* lose money over a year. Sellers win more often, but blow-ups are catastrophic.

## Payoff diagrams

### Long Call
![Long Call payoff: capped loss at premium, unlimited profit above strike + premium](/trading-assets/intermediate/03/payoff-long-call.png)
Read the line left to right. While spot is below the strike (left half), the line sits flat at a small loss — you've paid the premium and the option is worthless on expiry. The line stays flat right up to strike. Past the strike, it ticks down to crossing zero at **K + premium** (the yellow breakeven dot) and then climbs unboundedly. **Max loss = premium paid; max profit = unlimited.** That's the entire promise of a long call in one picture.

- Breakeven: K + premium.

### Long Put
![Long Put payoff: capped loss at premium, large profit as spot falls below strike − premium](/trading-assets/intermediate/03/payoff-long-put.png)
Mirror image. The flat-loss zone is now on the *right* (spot above strike, put expires worthless), and profit grows as spot falls below **K − premium**. Profit is large but not technically infinite — it's capped by the stock going to zero. Same trade structure as a call, just the bearish version.

- Breakeven: K − premium.

### Short Call (very risky, unlimited loss)
![Short Call payoff: capped premium gain, unlimited loss as spot rises](/trading-assets/intermediate/03/payoff-short-call.png)
Now flip the long call **upside down**. While spot stays below strike, you keep the entire premium (the flat green region on the left). But the moment spot pushes past **K + premium**, the line dives — and **never stops diving**. There's no theoretical ceiling on a stock's price, so there's no ceiling on this loss. This is the picture every "easy income from selling options" pitch conveniently hides.

### Short Put (cash-secured)
![Short Put payoff: capped premium gain, large loss capped at strike if stock goes to zero](/trading-assets/intermediate/03/payoff-short-put.png)
Mirror of the short call — flip the long put upside down. Profit capped at premium received (right side, flat green), loss grows as spot falls below **K − premium**, and the worst case is the stock going to zero (so loss is large but bounded, unlike the short call). This is why short puts are considered *much* safer than short calls: there's a worst case you can plan for. "Cash-secured" means you've parked enough cash to actually buy the stock at strike if assigned — a way to express bullishness while collecting premium.

Max loss = strike − premium (if stock goes to 0).

## Option chain — how to read it

Across a single expiry, every available strike is listed:

| Calls (LTP, OI, IV) | Strike | Puts (LTP, OI, IV) |
|---|---|---|
| 380 | 24300 | 30 |
| 250 | 24400 | 50 |
| **150** | **24500 (ATM)** | **140** |
| 80 | 24600 | 250 |
| 35 | 24700 | 380 |

What to look for:
- **Highest OI on call side** = market sees that strike as **resistance**.
- **Highest OI on put side** = strike seen as **support**.
- **OI buildup changes** intraday show where smart money is positioning.
- **PCR (Put-Call Ratio)** = total put OI / total call OI. > 1 typically bullish (more puts = hedging), < 0.7 bearish (complacency).

## Implied Volatility (IV)

The market's expectation of future volatility, baked into the premium.

- **High IV** → expensive options. Good for **selling**, bad for **buying**.
- **Low IV** → cheap options. Good for **buying**.
- **IV crush** — IV drops sharply after a known event (earnings, RBI policy) → premiums collapse even if direction was right.

> A common rookie disaster: buying a call before earnings on a "sure" stock. Stock pops 3% next morning, but IV crashes from 60 to 35 → premium drops despite the move. **You were directionally right and still lost money.**

## Beginner-safe option strategies

| Strategy | View | Risk | Reward |
|----------|------|------|--------|
| Long Call / Long Put | Strong directional | Premium | Unlimited |
| Bull Call Spread | Mildly bullish | Limited | Limited |
| Bear Put Spread | Mildly bearish | Limited | Limited |
| Cash-secured Put | Mildly bullish + ok to own stock | Strike − premium | Premium |
| Covered Call | Own stock, expect sideways | Stock downside | Premium |

> **Avoid as a beginner:** Naked short options, straddles/strangles, short iron condors. They look easy until vol spikes and your account vaporizes.
