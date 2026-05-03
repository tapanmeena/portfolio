---
title: "Advanced Options Strategies"
description: "You've seen calls, puts, basic spreads. This chapter is about multi-leg structures — used to express specific views on direction + volatility + time, with defined risk."
tier: advanced
order: 4
source: "../TradingBot/docs/advanced/04-advanced-options.md"
---
# 4. Advanced Options Strategies

You've seen calls, puts, basic spreads. This chapter is about **multi-leg structures** — used to express specific views on direction + volatility + time, with defined risk.

## Spreads (vertical)

Two options, same expiry, different strikes.

### Bull Call Spread
- Buy ATM/ITM call, sell OTM call.
- Net cost = lower than naked call.
- Max profit = (high strike − low strike) − net premium.
- Max loss = net premium.

**Use:** Mildly bullish, IV moderate, want defined risk.

### Bear Put Spread
- Buy ATM/ITM put, sell OTM put.
- Mirror of the above.

### Bull Put Spread (Credit)
- Sell higher-strike put, buy lower-strike put.
- Net **credit** (you receive premium).
- Profit if price stays above short strike.

**Use:** Mildly bullish + high IV → sell premium with defined risk.

### Bear Call Spread (Credit)
- Sell lower call, buy higher call.
- Profit if price stays below short strike.

## Straddles & Strangles

### Long Straddle
- Buy ATM call + ATM put (same strike).
- Profits from large move either direction.
- Max loss = total premium.

**Use:** Pre-event, expecting big move, IV low.

### Short Straddle
- Sell ATM call + ATM put.
- Profits if price stays at strike.
- **Unlimited risk** on both sides.

**Use:** Range-bound view, high IV — but **never naked**. Always cap with wings.

### Long/Short Strangle
- Same as straddle but with OTM strikes (call > spot, put < spot).
- Cheaper than straddle, needs bigger move to profit.

## Iron Condor

A **range-bound, defined-risk** structure. Four legs:

```
Sell OTM put         (e.g., 24300 PE)
Buy further OTM put  (e.g., 24200 PE)
Sell OTM call        (e.g., 24700 CE)
Buy further OTM call (e.g., 24800 CE)
```

= short strangle + long strangle wings.

- Max profit = net credit, achieved if Nifty stays between 24300 and 24700.
- Max loss = (wing width) − credit.
- **Defined risk** on both sides.

**Use:** High IV, expecting range, want limited risk. Common Nifty/Bank Nifty weekly play.

### Iron Butterfly
Same idea but short legs at the same (ATM) strike:

```
Sell ATM put + Sell ATM call (= short straddle)
Buy OTM put + Buy OTM call (wings)
```

Higher credit than condor, narrower profit zone.

## Calendar (Time / Horizontal) Spreads

Sell front-month, buy back-month, **same strike**.

- Profit from front-month decaying faster than back.
- Best when underlying stays near strike.
- **Vega positive** (helps if IV rises).

### Diagonal
Same as calendar but different strikes. Combines time + directional bets.

## Ratio Spreads

Buy 1 close-to-money option, sell 2 (or 3) further OTM options.

### Call Ratio Spread
```
Buy 1 ATM CE
Sell 2 OTM CE
```

Profits from a controlled upmove (max profit at the short strikes). Loses if price rallies hard past short strikes.

**Use:** Mildly bullish, expect price to drift to short strike.

### Backspread
**Sell 1 ATM, buy 2 OTM.** Opposite Greek profile — profits from huge moves.

## Broken-wing Butterflies (BWB)

Asymmetric butterflies — one wing wider than the other. Often opened for credit (no upfront cost).

```
Buy 1 ITM put
Sell 2 ATM puts
Buy 1 far-OTM put
```

Skewed risk/reward, used by experienced traders to express directional view with low/no debit.

## Choosing the right structure — decision matrix

| View | IV | Best structure |
|------|----|----|
| Strongly bullish | Low | Long call / Bull call spread |
| Strongly bullish | High | Bull put spread (credit) |
| Mildly bullish | High | Bull put spread / Cash-secured put |
| Strongly bearish | Low | Long put / Bear put spread |
| Strongly bearish | High | Bear call spread |
| Range-bound | High | Iron condor / Short strangle (with hedges) |
| Range-bound | Low | Long calendar |
| Big move expected, direction unknown | Low | Long straddle / strangle |
| Big move expected | High | Calendar/diagonal — vega play |

## Adjustments — when trades go wrong

A position moves against you. Don't just close — **adjust**.

### Iron condor: short put side under threat
- **Roll** the short put down and out (lower strike, later expiry).
- Add a **debit put spread** below to provide more cushion.
- **Convert** to an iron butterfly (move call side closer to action).

### Long calendar: underlying moved away from strike
- **Roll** to a new strike near current price.
- **Convert** to diagonal by adjusting the back-month strike.

### Short strangle: one side under pressure
- **Roll the untested side closer** to collect more credit (raises breakeven).
- **Add a hedge wing** to convert to an iron condor.

> Adjustments **buy time and reduce risk**. They don't always rescue trades — sometimes the right move is to **take the loss** and move on. Don't adjust losers indefinitely; that's how 1R losses become 5R disasters.

## Position sizing for option structures

Not based on number of lots — on **maximum loss vs capital**.

$$ \text{Lots} = \frac{\text{Capital} \times \text{Risk \%}}{\text{Max loss per lot}} $$

For a defined-risk structure (condor) with max loss ₹3,000/lot, capital ₹5L, 1% risk:
$$ \text{Lots} = \frac{5{,}000}{3{,}000} = 1 \text{ lot (rounded down)} $$

For undefined-risk structures (naked shorts), use a **stress test**: what if the underlying moves 5%? 10%? Position size for the **stress scenario**, not the typical one.

## Greeks of common structures (quick ref)

| Structure | Δ | Γ | Θ | ν |
|-----------|---|---|---|---|
| Long call | + | + | − | + |
| Bull call spread | + | small + | small − | small + |
| Bull put spread (credit) | + | small − | + | − |
| Long straddle | 0 | ++ | −− | ++ |
| Short straddle | 0 | −− | ++ | −− |
| Iron condor | 0 | − | + | − |
| Iron butterfly | 0 | −− | ++ | −− |
| Long calendar (ATM) | 0 | small − | + | + |
| Call ratio | + → − | varies | + | − |

Use this to check: "Does my structure's Greek profile match my view?"

## Putting it all together — a weekly options play

**Setup:** Bank Nifty closed at 51,200 on Monday. India VIX at 14. No major events this week.

**View:** Range-bound expected (no catalyst). Modest theta, willing to take limited risk.

**Trade:** Iron Condor for Thursday expiry.
- Sell 50800 PE, Buy 50500 PE
- Sell 51600 CE, Buy 51900 CE

Net credit: ₹120 × 15 (lot) = ₹1,800 per lot.
Max loss: ₹300 wing − ₹120 credit = ₹180 × 15 = ₹2,700 per lot.

R:R = 1.5:1 reward (asymmetric, but high prob).

**Management:**
- Profit target: 50% of max credit (close at +₹900 per lot).
- Adjustment trigger: if Bank Nifty breaches a short strike, roll the untested side.
- Stop: if max loss is hit, accept and exit.

**Expected:** ~70% win rate on these. Edge is in **process** (consistent execution, no panic adjustments).
