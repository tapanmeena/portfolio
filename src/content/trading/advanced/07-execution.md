---
title: "Execution Algorithms"
description: "Once your size grows past a certain threshold, how you enter and exit matters as much as what you trade. A good signal poorly executed loses money. This chapter is about minimiz…"
tier: advanced
order: 7
source: "../TradingBot/docs/advanced/07-execution.md"
---
# 7. Execution Algorithms

Once your size grows past a certain threshold, **how** you enter and exit matters as much as **what** you trade. A good signal poorly executed loses money. This chapter is about minimizing market impact and slippage.

## The execution problem

You want to buy 50,000 shares of XYZ.
- Average daily volume = 200,000 shares.
- Best ask currently = ₹500, ask depth = 2,000 shares.

If you blast a market order:
- First 2k fill at 500.
- Next 3k at 500.50.
- Next 5k at 501.20.
- ...You finish around 504, paying 0.8% in **slippage** (~₹2L).

Smart execution can reduce that to 0.1–0.2%.

## Order types — execution focused

| Order | Behavior | Use |
|-------|---------|-----|
| **Market** | Eats book immediately | Tiny orders, urgency |
| **Limit (passive)** | Sits on the book | Patient entries, earns spread |
| **Limit (aggressive)** | Crosses spread | Takes liquidity, controlled fill |
| **IOC** (Immediate or Cancel) | Fills what's available now, cancels rest | Multi-leg, hidden execution |
| **FOK** (Fill or Kill) | All-or-nothing instant | Rare, usually for blocks |
| **Iceberg** | Shows only a slice; refills automatically | Hide size from the book |
| **AMO** | Queues for next session | Off-hours decisions |

In NSE retail, **iceberg** is supported by most brokers (with ~10 disclosed slices max).

## TWAP — Time-Weighted Average Price

Spread the order **evenly over time**.

```
Total qty: 50,000 over 60 minutes
Slice every minute: ~833 shares
```

- **Pros:** Predictable, low signaling.
- **Cons:** Doesn't adapt to market conditions; bad in trending markets.
- **Use:** Simple, when you don't have a strong view on intraday liquidity.

## VWAP — Volume-Weighted Average Price

Match the historical **intraday volume curve**.

NSE's typical volume profile (U-shaped):
- 09:15–10:00: 22% of day's volume
- 10:00–14:00: 30% (sparse)
- 14:00–15:30: 48% (afternoon surge)

A VWAP algo executes more shares when volume is high → blends in with natural flow.

- **Pros:** Better than TWAP in normal markets, common benchmark.
- **Cons:** Predictable if others know your style; vulnerable to gaming.
- **Use:** Standard for institutional execution. Brokers offer VWAP algos.

## POV — Percentage of Volume

Trade a constant % of the market's real-time volume.

```
target_pov = 10%
if last_minute_market_volume == 5000:
    my_order = 500 in next minute
```

- **Pros:** Adapts to market; never dominates.
- **Cons:** May not finish if volume is low; can take all day.
- **Use:** Large orders where finishing on time is flexible.

## Implementation Shortfall (IS)

Minimize total cost vs the **arrival price** (price when decision was made).

Cost = Market impact + Timing risk + Spread cost.

IS algos balance **speed** (less timing risk) vs **patience** (less impact). A more aggressive IS algo trades fast (paying impact). A more passive one trades slow (eating timing risk).

Used by quants who care about beating arrival price, not VWAP.

## Iceberg orders (deeper)

You want to buy 10,000 but show only 500 at a time.

- Place limit at ₹500 with disclosed qty 500.
- When 500 fills, broker auto-places another 500.
- Repeat until total filled.

Avoids signaling your size to other participants. Especially useful in mid/small caps with thin books.

> Indian exchanges have minimum disclosed qty rules — check broker docs.

## Sniper / opportunistic execution

For mean-reversion entries: place a limit deep in the book and wait. If price reaches you, you got a great fill. If not, you missed — but no slippage.

```
Stock at 500.10
Bid stack: 100@500.00, 200@499.95
You place: buy 1000 @ 499.50

Wait... if dipped, you got filled at 499.50.
If not, no trade.
```

Used by HFTs and passive market makers. Adds liquidity, earns spread.

## Slippage modeling

For backtesting realism, slippage cost ≈ a function of:

$$ \text{slippage} \approx k \cdot \sigma \cdot \sqrt{\frac{Q}{V}} $$

Where $\sigma$ = volatility, $Q$ = your order size, $V$ = ADV. Empirically, $k \approx 0.5–1.0$.

For most retail orders < 0.1% of ADV → slippage is just spread + 0.05%. Above 1% of ADV → it becomes painful.

## Market impact — temporary vs permanent

- **Temporary impact** — price moves due to your order pressure, then reverts after you stop.
- **Permanent impact** — your trade revealed information; price stays moved.

Larger orders = larger permanent impact. **Splitting orders over time** reduces both, but doesn't eliminate them.

## Choosing an execution style

| Order size vs ADV | Recommended |
|-------------------|-------------|
| < 0.1% | Market or aggressive limit, single shot |
| 0.1% – 1% | Iceberg or simple TWAP over 5–30 min |
| 1% – 5% | VWAP or POV over the day |
| > 5% | Multi-day execution; consider negotiating block trade |

> Most retail traders never need more than market/limit + iceberg. Algos matter when you're executing crores per trade.

## Execution metrics to track

For every fill:
- **Slippage vs decision price** (basis points).
- **Slippage vs VWAP**.
- **Fill rate** (filled / requested).
- **Reversion** — did price come back after your trade? (Indicates over-aggressive execution.)

Average over hundreds of trades → know your **real cost of trading**, not the theoretical zero of backtests.

## Direct Market Access (DMA) & broker APIs

For algo execution, you need:
- **Low-latency broker API** (Kite Connect, Upstox, Angel One — all decent for retail).
- **Co-location** for HFT (only worthwhile for sub-millisecond strategies; institutional only).
- **Reliable internet** + UPS + 4G failover.

Most retail trading bots (including this project) run on standard broker APIs, polling at 1–5 second intervals — completely fine for swing/positional strategies.

## Common execution pitfalls

1. **Market orders in illiquid stocks** — get fleeced. Always use limits.
2. **Blasting size at the open** — first 5 minutes have wide spreads & noise. Wait.
3. **Chasing fills** — modifying limit upward after misses → ends with worst price of the day.
4. **Ignoring corporate actions** — orders may behave oddly on ex-date.
5. **Stale prices** — using delayed quotes (15-min lag) for execution decisions.
6. **No fill timeouts** — orders left dangling can fill at terrible prices later.

## Testing execution

Before going live with a new algo:

1. **Paper trade** with simulated execution that includes realistic slippage.
2. **Live test with 1 share** — verify the API does what you expect.
3. **Live test with small size** — measure actual fills vs expectations.
4. **Scale up gradually** — only after 100+ trades of consistent behavior.

Bugs in execution can lose money faster than bugs anywhere else. **Have hard sanity checks**: max order size, max # orders per minute, kill switch on unexpected behavior.

## Reading list

- *Algorithmic Trading & DMA* — Barry Johnson (the standard reference).
- *Trades, Quotes and Prices* — Bouchaud, Bonart, Donier, Gould.
