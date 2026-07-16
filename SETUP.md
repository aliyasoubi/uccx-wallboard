# Running this project

```bash
npm install
npm start
```

Then open http://localhost:4200.

## What's real vs. mocked right now

- **Data**: `BffClientService` reads ten JSON files in `src/assets/fixtures/`
  instead of calling a live backend. The dashboard polls them every 3s and
  re-renders through the same store/signal pipeline a real backend would use.
- **Three fixtures are provisional, not confirmed contracts**:
  `TopSkills.json`, `InboundStats.json`/`OutboundStats.json`, and
  `ShiftMetrics.json` were inferred from a screenshot, not a real API spec.
  The corresponding DTOs (`skill-stat.dto.ts`, `call-direction-stats.dto.ts`,
  `shift-metrics.dto.ts`) are marked `PROVISIONAL` in a comment — check
  field names against the real backend before going live.
- **To connect a real backend**: change the `http.get(...)` calls in
  `src/app/core/data-access/bff-client.service.ts` to point at the real BFF
  routes instead of `assets/fixtures/*.json`. Nothing else in the app needs
  to change.
- **To move to WebSocket later**: implement a `WebSocketDataSource` matching
  the `DataSource` interface in `src/app/core/data-access/data-source.token.ts`,
  then change one line in `src/app/app.config.ts`:
  `{ provide: DATA_SOURCE, useClass: WebSocketDataSource }`.
- **Theme**: `src/app/shared/styles/_tokens.scss` is the confirmed navy-blue
  palette. Change it there once and every component picks it up — nothing
  is hardcoded per-component.

## What still needs real unit tests

This scaffold prioritized getting the architecture, data flow, and shared
components right end-to-end. Before shipping, add Jasmine specs for:
- Every function in `core/mappers/*` (this is the layer that had the real
  contract-drift bug in the original app)
- `getSeverity()` / `getInverseSeverity()` / `getRatioSeverity()` in
  `core/policies/status-thresholds.policy.ts`
- `PollingDataSource`'s error/backoff behavior
- `AgentStateDonutComponent` — verify the segment math always sums to the
  displayed total (this was the actual bug in the original design)
