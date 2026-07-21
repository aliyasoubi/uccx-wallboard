# Running this project

```bash
npm install
npm start
```

Then open http://localhost:4200.

## What's real vs. mocked right now

- **Data**: `BffClientService` reads JSON fixtures in `src/assets/fixtures/`
  instead of calling a live backend. The dashboard polls them (interval set
  by `assets/config.json`'s `pollIntervalMs`, 3s by default) and re-renders
  through the same store/signal pipeline a real backend would use.
- **Provisional/mocked fields** — see README.md §9 for the full list and
  the reasoning behind each. Short version: `fcr` (KPI Metrics), `timings`
  / CWD-MAD-ACT (Queue Displays), and per-queue `serviceMetrics`/SLA are
  all mocked in the fixtures pending a confirmed backend contract. Each is
  marked `PROVISIONAL` in a comment at its DTO.
- **To connect a real backend**: two steps, both in CONFIGURATION.md:
  1. Set `useMockFixtures: false` and the real `apiBaseUrl` — either in
     `environment.ts`/`environment.production.ts` (build-time) or in
     `assets/config.json` (runtime, no rebuild — see below).
  2. Check the route paths in `BffClientService`'s `endpoint(...)` calls
     match the real BFF's actual routes.
- **To change the API/DB address or poll interval without rebuilding**:
  edit `src/assets/config.json` on the deployed server and refresh the
  page. This is loaded by `AppConfigService` via an `APP_INITIALIZER`
  before the app renders — see CONFIGURATION.md §5 for details. (This
  mechanism previously existed in code but wasn't actually wired up; it is
  now.)
- **To move to WebSocket later**: implement a `WebSocketDataSource`
  matching the `DataSource` interface in
  `src/app/core/data-access/data-source.token.ts`, then change one line in
  `src/app/app.config.ts`: `{ provide: DATA_SOURCE, useClass:
  WebSocketDataSource }`.
- **Theme**: `src/app/shared/styles/_tokens.scss` is the confirmed
  navy-blue palette. Change it there once and every component picks it up.

## Module reference

See README.md §1 for the full table mapping each of the 12 required
dashboard modules (Call Summary Displays, Top Inbound/Outbound Agent,
Agent Summary, Agent of the Month, Agent State, SLA Gauge, Customer
Satisfaction, KPI Metrics, Queue Displays, Header, Footer) to its component
selector and source path.

## Tests

```bash
npm test           # interactive, Karma launches a real Chrome window
npm run test:ci     # headless single run with coverage (CI-friendly)
```

`angular.json` previously had no `test` architect target at all — `ng test`
didn't work out of the box. That's fixed (`karma.conf.js` +
`tsconfig.spec.json` added).

Current coverage: 97 specs, all passing, ~90% statement / ~88% function
coverage. Covers:
- Every function in `core/mappers/*`, including the previously-dropped
  `Agent.inboundCalls`/`outboundCalls` mapping and the previously-unmapped
  `CsqDto.serviceMetrics` contract-drift fix.
- `getSeverity()` / `getInverseSeverity()` / `getRatioSeverity()` in
  `core/policies/status-thresholds.policy.ts`.
- `PollingDataSource`'s error/backoff behavior (stale → error escalation,
  recovery, and that failed ticks never leak a null/undefined snapshot
  onto `updates$`).
- `AgentStateDonutComponent` — segment math always sums to the displayed
  total, and the arc lengths sum to the full SVG circumference.
- `TopAgentTracker` — dynamic-max semantics (rises, never falls on a dip),
  the 24-hour reset window, and `localStorage` persistence across
  instances (survives a page refresh).
- `AgentSummaryComponent` — direct regression test that every agent in the
  input array renders as its own row with its own data, addressing the
  originally reported "only the first list item works" symptom (which
  wasn't reproducible against this codebase — see README.md §11.4).
- `AppConfigService`, `DashboardStoreService`, and most of the new/changed
  dashboard components (`HeaderComponent`'s clock, `FooterComponent`'s
  status text, `QueueListComponent`'s waiting/serving variants and severities,
  `TopAgentComponent`'s per-direction wiring, `CallSummaryDisplaysComponent`).

Not yet covered (lower priority — pure composition/layout, no logic of
their own): `DashboardComponent` itself, `SlaGaugeComponent` /
`CustomerSatisfactionGaugeComponent` / `KpiMetricsComponent` beyond what's
exercised indirectly, `AgentOfMonthComponent`.
