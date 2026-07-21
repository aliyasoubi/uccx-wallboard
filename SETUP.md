# Setup

```bash
npm install
npm start
```

Then open http://localhost:4200.

## What's real vs. mocked

- **Data**: `BffClientService` reads JSON fixtures in
  `src/assets/fixtures/` instead of a live backend. The dashboard polls
  them (interval set by `assets/config.json`'s `pollIntervalMs`, 3s by
  default) through the same store/signal pipeline a real backend would
  use.
- **Provisional/mocked fields** — see README.md §6. In short: `fcr` (KPI
  Metrics), `timings`/CWD-MAD-ACT (Queue Displays), and per-queue
  `serviceMetrics`/SLA are mocked in the fixtures pending a confirmed
  backend contract. Each is marked `PROVISIONAL` in a comment at its DTO.
- **Connecting a real backend**: see CONFIGURATION.md §2.
- **Changing the API/DB address or poll interval without rebuilding**:
  edit `src/assets/config.json` on the deployed server and refresh — see
  CONFIGURATION.md §2.
- **Moving to WebSocket**: implement a `WebSocketDataSource` matching the
  `DataSource` interface in
  `src/app/core/data-access/data-source.token.ts`, then swap the provider
  in `src/app/app.config.ts`.
- **Theme**: `src/app/shared/styles/_tokens.scss` holds the palette —
  change it once, every component picks it up.

## Module reference

See README.md §1 for the full table mapping each of the 12 dashboard
modules to its component selector and source path.

## Tests

```bash
npm test           # interactive, Karma launches a real Chrome window
npm run test:ci    # headless single run with coverage (CI-friendly)
```

Coverage: 109 specs, ~90% statement / ~89% function coverage.

- Every function in `core/mappers/*`.
- `getSeverity()` / `getInverseSeverity()` / `getRatioSeverity()` in
  `core/policies/status-thresholds.policy.ts`.
- `PollingDataSource`'s error/backoff behavior (stale → error escalation,
  recovery).
- `AgentStateDonutComponent` — segment math sums to the displayed total;
  arc lengths sum to the full SVG circumference.
- `TopAgentTracker` — dynamic-max semantics, 24-hour reset window,
  `localStorage` persistence.
- `AgentSummaryComponent` — every agent in the input array renders as its
  own row.
- `AppConfigService`, `DashboardStoreService`, `QueueListComponent`
  (cross-queue aggregation rules), `TopAgentComponent`,
  `CallSummaryDisplaysComponent`, `HeaderComponent`, `FooterComponent`.
- `MetricTileComponent`'s optional `icon` input.

Not yet covered (pure composition/layout, no logic of their own):
`DashboardComponent`, `SlaGaugeComponent`,
`CustomerSatisfactionGaugeComponent`, `KpiMetricsComponent`,
`AgentOfMonthComponent`.
