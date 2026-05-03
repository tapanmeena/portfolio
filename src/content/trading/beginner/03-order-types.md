---
title: "Order Types"
description: "The order type controls how and when your trade gets executed. Picking the wrong one is a common rookie mistake."
tier: beginner
order: 3
source: "../TradingBot/docs/learn/03-order-types.md"
---
# 3. Order Types

The order type controls **how** and **when** your trade gets executed. Picking the wrong one is a common rookie mistake.

## The two basics

### Market order
- "Buy/Sell **right now** at whatever price is available."
- Pros: Guaranteed execution.
- Cons: No price control. In illiquid stocks you can get a terrible fill (slippage).
- **Use when:** Liquidity is high and you must get in/out immediately.

### Limit order
- "Buy at ₹X **or lower**" / "Sell at ₹X **or higher**."
- Pros: Price control.
- Cons: May never execute if the market doesn't reach your price.
- **Use when:** You have a target entry price and aren't in a hurry.

## Stop-loss orders

A stop-loss (SL) is a **conditional order** that activates when price hits your trigger.

### SL (Stop-Loss Limit)
- You set a **trigger price** AND a **limit price**.
- When trigger hits → a limit order is placed at your limit price.
- **Risk:** In a fast-moving gap, price may blow past your limit and the order won't fill.

### SL-M (Stop-Loss Market)
- You set only a **trigger price**.
- When trigger hits → a **market order** fires.
- **Risk:** Slippage in volatile moves, but execution is (almost) guaranteed.

> **Beginner rule:** Use **SL-M** unless you have a specific reason. Getting filled matters more than getting the perfect price when your thesis is wrong.

### Example
You buy ABC at ₹100. You want to risk only ₹5/share.

| Order type | Trigger | Limit |
|------------|---------|-------|
| SL | ₹95 | ₹94.50 |
| SL-M | ₹95 | — (market) |

## GTT — Good Till Triggered

- The order **sits at the broker** (not the exchange) until your trigger fires.
- Lifespan: typically 1 year.
- Great for **swing traders** and **investors** who don't want to watch the screen.
- Most retail brokers (Zerodha, Upstox) support single-leg and OCO (one-cancels-other) GTTs.

**Use case:** You want to buy HDFC Bank if it dips to ₹1,400, but you're at work all day.

## Product types — how long the position lives

This is **separate** from order type and equally important.

| Product | Lives for | Leverage | Notes |
|---------|-----------|----------|-------|
| **CNC** | As long as you want | None (you pay full ₹) | Shares hit your demat by T+1 |
| **MIS** | Same trading day | ~5x for most stocks | **Auto-squared off ~3:20 PM** |
| **NRML** | Until F&O expiry | Per SEBI margin rules | F&O segment |

### Common pitfall
Buying a stock with **MIS** thinking you "own" it. You don't — at 3:20 PM the broker will auto-square-off, often at a loss after brokerage. If you intend to hold, always select **CNC**.

## Order validity

| Validity | Meaning |
|----------|---------|
| **DAY** | Cancels at end of session if unfilled (default) |
| **IOC** | Immediate Or Cancel — fills whatever is available instantly, cancels the rest |

## AMO — After Market Order

Place orders outside market hours; they queue up and fire at the next open. Useful if you have a day job and want to act on after-close news (carefully — gaps can hurt).

## Putting it together — anatomy of a real trade

You want to swing-trade Tata Motors, expecting a breakout above ₹950.

1. **Entry:** SL order, trigger ₹950, limit ₹952. Product: **CNC**.
2. **Stop-loss:** Once filled, place SL-M at ₹925 (risking ₹25/share).
3. **Target:** Limit sell at ₹1,025 (reward ₹75/share — that's a 1:3 R:R).

Or use a **GTT-OCO** that holds both the SL and target — whichever triggers first cancels the other.
