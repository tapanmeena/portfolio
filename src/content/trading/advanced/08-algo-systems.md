---
title: "Algorithmic Trading Systems"
description: "When discretionary trading hits its scaling limit, you build a system. This chapter is about the engineering of trading software — architecture, reliability, monitoring, and the…"
tier: advanced
order: 8
source: "../TradingBot/docs/advanced/08-algo-systems.md"
---
# 8. Algorithmic Trading Systems

When discretionary trading hits its scaling limit, you build a system. This chapter is about the **engineering** of trading software — architecture, reliability, monitoring, and the hard-won lessons that prevent silent disasters.

## Why automate?

- **Consistency** — no emotional deviation from the plan.
- **Scale** — 50 strategies across 200 stocks, monitored 24/7.
- **Speed** — react to alerts in milliseconds, not minutes.
- **Backtest-live alignment** — same code logic in research and production.

## What NOT to automate

- A strategy you don't fully understand.
- A strategy that hasn't been forward-tested live (manually).
- Anything before you've experienced live drawdown psychologically.
- "Black box" ML models you can't explain.

> The biggest danger of automation: **scaling a broken strategy to lose money faster.** Automate winners, not hopes.

## System architecture (high-level)

```
                    ┌─────────────────┐
                    │  Market Data    │
                    │  (broker API,   │
                    │   websocket,    │
                    │   tick stream)  │
                    └────────┬────────┘
                             │
                  ┌──────────▼──────────┐
                  │   Data normalizer   │
                  │   + storage (DB)    │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │   Strategy engine   │
                  │   (signal gen)      │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │   Risk gateway      │
                  │   (sanity checks)   │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │   Order manager     │
                  │   (broker API,      │
                  │    state, retries)  │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │   Monitoring +      │
                  │   alerts (Telegram, │
                  │   Pagerduty)        │
                  └─────────────────────┘
```

This is roughly the architecture of [StalkMarket](../../DESIGN.md). Each layer has a single responsibility.

## Core components

### 1. Market data

- **Polling** (REST) — simple, slow (1–5s). Fine for swing.
- **Websocket / streaming** — sub-second updates, more complex.
- **Storage** — store everything (ticks, candles) for replay/backtesting. SQLite/DuckDB for small scale, TimescaleDB/ClickHouse for big.

Best practice: **separate "market data ingestion"** from strategy logic. Strategies read from the DB; ingestion writes to it. Clean separation, easy to test.

### 2. Strategy engine

A **pure function**:
$$ \text{signal} = f(\text{market state, parameters, position state}) $$

No side effects, no IO. Easy to test, easy to backtest with the same code.

```python
def evaluate(state, ltp, params) -> Signal:
    if state.position == 0 and ltp > state.swing_high:
        return Signal(action="ENTER_LONG", qty=size_for_risk(state, ltp))
    elif state.position > 0 and ltp <= state.stop:
        return Signal(action="EXIT", qty=state.position)
    else:
        return Signal(action="HOLD")
```

### 3. Risk gateway

The most important component. Sits between strategy signals and the broker:

- Max order size cap.
- Max # orders per minute.
- Max total exposure.
- Per-stock exposure cap.
- Kill switch on unusual behavior.
- Daily loss limit → halt new orders.

**Every strategy signal must pass risk checks.** No exceptions. This single layer prevents 99% of "fat finger" or runaway-bot disasters.

### 4. Order manager

- Translates signals into broker API calls.
- Tracks order state (placed → modified → filled → rejected).
- Handles retries on transient failures.
- Reconciles **broker state** with **internal state** at startup.
- Persists every order action for audit.

Idempotency is critical: if your bot crashes mid-order, you must not double-place when it restarts.

### 5. Monitoring

Without monitoring, your bot is a Russian roulette barrel. Required:

- **Heartbeat** — system is alive (alerted if stops).
- **Per-trade alerts** — entries, exits, stops, errors.
- **Position summary** — daily snapshot.
- **Error logs** — every exception, retry, anomaly.
- **Drift detection** — actual P&L vs expected from signals.

Channels: Telegram bot (free, reliable), Discord webhook, PagerDuty for paid setups.

## State management

State must be **persistent and crash-safe**. If your bot dies mid-trade, on restart it must:
1. Read its last known state from DB.
2. Reconcile with broker (positions, open orders).
3. Resume from the correct point.

> Use a real database (SQLite at minimum), not in-memory dicts. WAL mode for concurrency.

## Time & timezones

Everything UTC internally. Display in IST. **Never** mix.

NSE-specific timing edge cases:
- Pre-open vs continuous session.
- Holiday calendar (gets out of date — refresh annually).
- DST in foreign markets affecting your scheduling.
- Daylight savings (India has none, but global integrations may).

## Testing strategy

Layered:

1. **Unit tests** — each pure function. Fast, comprehensive.
2. **Integration tests** — strategy + DB + mocked broker. Verify flows.
3. **Backtests** — historical replay on N years of data.
4. **Paper / forward tests** — live data, simulated execution.
5. **Canary deploys** — run new strategy with 5% of intended capital first.

> The same strategy code should run in backtest and live. Different code paths = bugs.

## Risk kill switches

Pre-define and **wire them up** in code:

| Trigger | Action |
|---------|--------|
| Daily loss > 3% | Block new entries; existing positions monitored |
| Daily loss > 5% | Liquidate all positions, halt for the day |
| Unrealized loss on single position > 5% | Force exit |
| > 50 orders in 5 min | Pause; require manual override |
| Broker disconnected > 30s | Halt; alert |
| Latency > X ms on critical path | Alert; halt new entries |
| Unexpected exception count > N/min | Halt; alert |

These are not optional. They are insurance against your own bugs.

## Deployment & infrastructure

Options for retail algo deployment:

| Option | Pros | Cons |
|--------|------|------|
| **Local desktop / laptop** | Free, easy | Power/internet failures kill bot |
| **Raspberry Pi (always-on)** | Cheap, low power, dedicated | Limited compute |
| **VPS** (DigitalOcean, AWS Lightsail) | Reliable, ~$5–20/mo | Setup, monitoring |
| **Cloud (AWS/GCP)** | Scalable, managed | Cost can balloon |

StalkMarket runs on a Raspberry Pi 5 with Docker — perfect balance for low-frequency strategies.

For low-latency: VPS in Mumbai (close to NSE).

## Logging & observability

Structured logs (JSON) make analysis easy. Pino, Winston, structlog.

Each log entry: timestamp, component, level, event, structured data.

```json
{
  "ts": "2026-05-03T10:34:21Z",
  "component": "strategy",
  "event": "signal_generated",
  "symbol": "RELIANCE",
  "action": "ENTER_LONG",
  "qty": 50,
  "ltp": 2456.30,
  "stop": 2410.00
}
```

Logs go to file → ship to a log aggregator (Loki, ELK) for searching across days.

## Failure modes to expect

- Broker API rate limits → throttle.
- Broker API outage → exponential backoff retry, alert.
- Auth token expiry → auto-refresh logic.
- Stale market data → detect and halt trades.
- Unexpected order rejections (margin, freeze qty) → log, alert, don't retry blindly.
- Power cut → bot restarts cleanly from persistent state.
- Internet outage → broker may auto-square off MIS positions; algo should recover gracefully.
- Bug in strategy logic → kill switch activates before damage compounds.

> Plan for failure. Then plan for the failure of your failure-handling code.

## Auditability

Keep records for:
- Tax filing.
- SEBI compliance (you don't need a PMS license for personal trading, but rules apply).
- Self-review and debugging.

Store **everything**: every signal, every order, every fill, every config change. Disk is cheap.

## Common engineering mistakes

1. **No backtest-live parity** — strategy works in backtest, fails live due to subtle data differences.
2. **No reconciliation** — internal state diverges from broker; hidden positions accumulate.
3. **Silent failures** — exceptions caught and ignored; bot looks fine but doesn't trade.
4. **Hardcoded values** — broker creds in code, not config. (Use env vars / secrets manager.)
5. **No version control** — "what changed before yesterday's loss?" — git everything.
6. **Trading off untested branches** — never deploy un-reviewed code.
7. **No graceful shutdown** — SIGTERM should close orders cleanly, not abandon them.

## Reading list

- *Building Algorithmic Trading Systems* — Kevin Davey.
- *Designing Data-Intensive Applications* — Martin Kleppmann (general but invaluable).
- *Site Reliability Engineering* — Google (free online).
- *Trading Evolved* — Andreas Clenow (modern systematic implementation in Python).
