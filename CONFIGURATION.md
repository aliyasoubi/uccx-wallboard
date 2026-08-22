# Configuration guide

This covers: how to point the app at a real backend/database address, how
runtime config actually works now, what to do when a backend field gets
renamed, and how often the dashboard polls. See README.md §3 for _why_ the
app is shaped this way (the BFF architecture); this is the practical "how
do I actually change it" reference.

There are two layers of config instead:

```
src/environments/                    # build-time — baked into the bundle
├── environment.ts                   #   used by `npm start` (dev)
├── environment.staging.ts           #   used by `ng build --configuration=staging`
└── environment.production.ts        #   used by `ng build --configuration=production`

src/assets/config.json               # runtime — read fresh on every page load
```

`environment.*.ts` exports:

```typescript
export const environment = {
  production: false,
  useMockFixtures: true, // true = read src/assets/fixtures/*.json
};
```

`assets/config.json` holds the two values you're most likely to want to
change on a deployed server without rebuilding:

```json
{
  "apiBaseUrl": "assets/fixtures",
  "pollIntervalMs": 3000
}
```

## 2. How to point the app at a real backend/DB — the easy way (no rebuild)

**This is now the primary, working mechanism** — in an earlier pass,
`AppConfigService` and `assets/config.json` existed in the codebase but
were never actually registered with the app, so editing the JSON file had
no effect and the app silently kept using the compiled-in
`environment.ts` values instead. That's fixed: `app.config.ts` now runs
`AppConfigService.load()` via an `APP_INITIALIZER` before the app renders,
and both `BffClientService` (the API address) and `PollingDataSource` (the
poll interval) read from `AppConfigService.config()` — which is exactly
`assets/config.json` — instead of `environment.ts`.

To point at a real backend/DB address:

1. Edit `src/assets/config.json` on the deployed server (or in your local
   `src/assets/` before building):
   ```json
   {
     "apiBaseUrl": "https://your-real-bff.example.com/api",
     "pollIntervalMs": 3000
   }
   ```
2. Set `useMockFixtures: false` in the relevant `environment.*.ts` (this
   one stays build-time — it's a deployment-target decision, not something
   you'd flip at runtime).
3. Refresh the page. No rebuild, no redeploy of the JS bundle — just the
   one JSON file.
4. Check the route paths in `BffClientService` (`src/app/core/
data-access/bff-client.service.ts`). Each resource has a placeholder
   real-mode path, e.g. `/agents`, `/call-stats`, `/csqs` — update the
   `realPath` argument in each `this.endpoint(...)` call to match the real
   BFF's actual route names.

Nothing else changes. The mappers, the store, and every component are
already decoupled from where the data comes from — that's the entire
point of the DataSource/BFF layering described in README.md §3–4.

If the real backend _is_ a database you're standing up yourself (rather
than an existing telephony system), that DB sits behind the BFF, not
behind Angular — the BFF is what should have a real `.env`/config for its
DB connection string, credentials, etc. That's a separate service from
this repo.

## 3. A backend field got renamed — what do I change?

This is exactly the failure mode the mapper layer exists to contain. The
fix is always two edits, never more:

**Example: the backend renames `agentID` to `agent_id` on `AgentStates`.**

1. **Update the DTO** — `src/app/core/models/dto/agent.dto.ts` is the only
   place allowed to know the wire format:
   ```typescript
   export interface AgentStateDto {
     agent_id: string; // was: agentID
     // ...
   }
   ```
2. **Update the matching mapper line** —
   `src/app/core/mappers/agent.mapper.ts`:
   ```typescript
   export function mapAgent(dto: AgentDto): Agent {
     return {
       id: dto.agent_id, // was: dto.agentID
       // ...
     };
   }
   ```

TypeScript will catch you if you miss a usage — changing the DTO field name
breaks the mapper at compile time. No component, no template, no fixture
other than the one JSON file itself needs to change, because everything
downstream of the mapper only ever sees the clean domain model, never the
raw DTO.

If a **new** field gets added rather than renamed, add it to the DTO, add
it to the domain model if the UI needs it, then map it across — same
two-or-three-file pattern. This exact pattern is how CWD/MAD/ACT, per-queue
SLA, and FCR were added in this pass — see `queue-timing-stats.dto.ts`,
`queue.mapper.ts`, and `service-metrics.mapper.ts` for worked examples.

## 4. Poll interval

**Currently 3000ms (3 seconds)**, set in `assets/config.json`'s
`pollIntervalMs` and read by `PollingDataSource` via `AppConfigService`.
To change it, edit that one JSON file on the server and refresh — no
rebuild needed (see §2).

Worth knowing: this fires 6 parallel `HTTP GET`s every interval (one per
resource — agents, call stats, queues, service metrics, agent state
counts, agent of month), via `forkJoin`. At 3s that's manageable for a
handful of dashboard clients hitting fixtures or a fast BFF, but if this
scales to many simultaneous wallboards hitting a real BFF, that's the
moment to prioritize the WebSocket phase from README.md §4/§10 —
push-based updates remove the polling cost entirely rather than requiring
interval tuning.

## Changelog

### This pass

- **Runtime config actually wired up.** `AppConfigService` +
  `assets/config.json` existed before but had no effect — now registered
  via `APP_INITIALIZER`, and both `apiBaseUrl` and `pollIntervalMs` are
  genuinely runtime-editable. See §2.
- **Queue Displays extended** with CWD/MAD/ACT/SLA (`QueueTimingStatsDto`,
  `CsqDto.serviceMetrics` now actually mapped) — see README.md §9 for the
  documented/mocked-field caveats on these.
- **FCR added** to `CustomerServiceMetricsDto` for the new KPI Metrics
  module — mocked pending a real backend field.

### Prior pass

- DTOs aligned to the real API contract (`AgentDto` nested `state`/
  `stateStats`/`inboundCallStats`/`outboundCallStats`; `CsqDto` nested
  `callStats`/`agentStateCounts`). Domain models and presentational
  components were unaffected — the mapper layer doing its job.
- Fixtures rewritten to match; the `handledlCalls` typo corrected at the
  mapper level (domain model uses `handledCalls`).
- Top Skills and Shift Metrics removed (unused DTOs/models/mappers/
  fixtures deleted).
- Multi-language disabled for this release, not deleted — see
  `app.config.ts` for the 3-step re-enable process.
