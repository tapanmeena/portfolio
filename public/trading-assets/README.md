# Trading docs assets

Static images embedded by the trading learning courses under [`../learn/`](../learn/), [`../intermediate/`](../intermediate/), and [`../advanced/`](../advanced/).

## Sources

- **TradingView widget** — public, embeddable charts (no login). Used for real market screenshots of indicators and patterns. Charts via TradingView, used here for educational purposes.
- **Self-rendered HTML/SVG** — conceptual diagrams (candle anatomy, payoff diagrams, drawdown tables, R:R visuals) generated from local HTML files under `scripts/screenshots/diagrams/`. Fully reproducible.

## Layout

```
docs/assets/
  learn/
    04/   # candles & patterns
    05/   # indicators
    06/   # risk management
    07/   # strategies
  intermediate/
    03/   # options basics (payoffs)
    04/   # option greeks
    06/   # advanced indicators
    09/   # sector & macro
```

## Regenerating

All capture specs live in [`scripts/screenshots/specs.ts`](../../scripts/screenshots/specs.ts).

```sh
npm run screenshots:list                  # list every spec without launching browser
npm run screenshots:capture               # capture all
npm run screenshots:capture -- --id rsi-divergence   # capture one
npm run screenshots:capture -- --chapter learn/05    # capture all in a chapter folder
```

Captures use Chromium via Playwright and write PNGs in place. Re-running overwrites existing assets.
