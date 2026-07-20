# Configuration guide

This covers four things: how to point the app at a real backend, whether
there's a `.env` file, what to do when a backend field gets renamed, and how
often the dashboard polls. All of this builds on the BFF architecture from
the first message in this thread (the original README's §3, "Backend — BFF,
not direct-to-source") — that document is still the source of truth for
*why* the app is shaped this way; this one is the practical "how do I
actually change it" reference.

## 1. Is there a `.env` file?

No, and there won't be one — Angular doesn't support `.env` files the way a
Node/React app does, because Angular apps are compiled to static files
ahead of time; there's no server process at runtime to read a `.env` from.

The Angular equivalent is `src/environments/environment*.ts`:

```
src/environments/
├── environment.ts              # used by `npm start` (dev)
├── environment.staging.ts      # used by `ng build --configuration=staging`
└── environment.production.ts   # used by `ng build --configuration=production`
```

Each exports the same shape:

```typescript
export const environment = {
  production: false,
  useMockFixtures: true,       // true = read src/assets/fixtures/*.json
  apiBaseUrl: 'http://localhost:3000/api',
  pollIntervalMs: 3000,
};
```

`angular.json` swaps the right file in at build time via `fileReplacements`
— whichever `environment.*.ts` is selected becomes `environment.ts` in the
compiled bundle. This means **changing environment values requires a
rebuild**, not just a restart. If you need to change the API URL without
rebuilding (e.g. the same build deployed to multiple environments), see the
"runtime config" note at the bottom of this file.

## 2. How to point the app at a real backend/DB

The frontend never talks to a database directly — it talks to the BFF (see
the original README §3). So "changing the backend" means changing which BFF
the app calls, not connecting to a DB from Angular.

Two steps:

1. **Open the relevant environment file** (`environment.ts` for local dev,
   `environment.staging.ts` / `environment.production.ts` for those
   targets) and set:
   ```typescript
   useMockFixtures: false,
   apiBaseUrl: 'https://your-real-bff.example.com/api',
   ```
2. **Check the route paths in `BffClientService`** (`src/app/core/data-access/bff-client.service.ts`).
   Each resource has a placeholder real-mode path, e.g. `/agents`,
   `/call-stats`, `/queues` — these are guesses at what the real BFF's
   routes will be called. Update the `realPath` argument in each
   `this.endpoint(...)` call to match the BFF's actual route names.

Nothing else changes. The mappers, the store, and every component are
already decoupled from where the data comes from (see the original README's
DataSource/BFF sections) — this is the entire point of that layering.

If the real backend *is* a database you're standing up yourself (rather
than an existing telephony system), that DB sits behind the BFF, not behind
Angular — the BFF is what should have a real `.env`/config for its DB
connection string, credentials, etc. That's a separate service from this
repo.

## 3. A backend field got renamed — what do I change?

This is exactly the failure mode the mapper layer exists to contain (see
the original code review — the old app's biggest bug was exactly this).
The fix is always two edits, never more:

**Example: the backend renames `agentID` to `agent_id` on `AgentStates`.**

1. **Update the DTO** — `src/app/core/models/dto/agent-state.dto.ts` is the
   only place allowed to know the wire format:
   ```typescript
   export interface AgentStateDto {
     agent_id: string;   // was: agentID
     ...
   }
   ```
2. **Update the matching mapper line** — `src/app/core/mappers/agent.mapper.ts`:
   ```typescript
   export function mapAgent(dto: AgentStateDto): Agent {
     return {
       id: dto.agent_id,   // was: dto.agentID
       ...
     };
   }
   ```

That's it. TypeScript will actually catch you if you miss a usage —
changing the DTO field name breaks the mapper at compile time, so there's
no way to update the DTO and forget the mapper without the build failing.
No component, no template, no fixture other than the one JSON file itself
needs to change, because everything downstream of the mapper only ever sees
the clean domain model (`Agent`), never the raw DTO.

If a **new** field gets added rather than renamed, add it to the DTO, add
it to the domain model if the UI needs it, then map it across — same
two-or-three-file pattern.

## 4. Poll interval

**Currently 3000ms (3 seconds)**, set in `environment.pollIntervalMs` and
read by `src/app/core/data-access/polling-data-source.ts`. To change it,
edit the value in the relevant `environment.*.ts` file — no code changes
needed, it's already externalized as config rather than a hardcoded
constant.

Worth knowing: this fires 10 parallel `HTTP GET`s every interval (one per
resource — agents, call stats, queues, etc.), via `forkJoin`. At 3s that's
manageable for a handful of dashboard clients hitting fixtures or a fast
BFF, but if this scales to many simultaneous wallboards hitting a real BFF,
that's the moment to prioritize the WebSocket phase from the original
README (§9, "later phase") — push-based updates remove the polling cost
entirely rather than requiring interval tuning.

## Runtime config (if you need to change the API URL without rebuilding)

Not implemented in this scaffold, but worth knowing the pattern exists: if
the same build artifact needs to be deployable to different environments
without a rebuild (common for containerized deployments), the standard
Angular approach is a `config.json` fetched once at startup via
`APP_INITIALIZER`, rather than baked-in `environment.ts` values. That's a
deliberate scope decision to raise with you before adding — it's more
moving parts than most internal ops dashboards need, but if multi-environment
deployment from one build becomes a real requirement, that's the mechanism
to reach for instead of more `environment.*.ts` files.

## Changelog — this pass

- **DTOs aligned to the real API contract.** `AgentDto` is now nested
  (`state`, `stateStats`, `inboundCallStats`, `outboundCallStats` sub-objects)
  and `CsqDto` now nests `callStats`/`agentStateCounts` instead of flat
  fields. The domain models and every presentational component were
  **unaffected** by this — that's the mapper layer doing its job. Only
  `agent.mapper.ts` and `queue.mapper.ts` needed to change.
- **Fixtures were out of sync with the new DTOs and have been rewritten**
  to match exactly (`AgentStates.json`, `CallStats.json`, `CsqStats.json`).
  The `handledlCalls` typo is gone from `CsqStats.json` — the new `CsqDto`
  reuses the already-corrected `CallStatsDto`, so there's no longer a typo
  to work around at the mapper level.
- **Top Skills and Shift Metrics removed** — DTOs, domain models, mappers,
  feature components, and unused fixture files (`TopSkills.json`,
  `ShiftMetrics.json`, `InboundStats.json`, `OutboundStats.json` — the
  latter two were already superseded by deriving inbound/outbound stats
  from the agent roster) all deleted.
- **Multi-language disabled for this release**, not deleted. `provideTransloco`
  is commented out in `app.config.ts`, and every component reverted to
  plain English strings. `transloco-loader.ts` and `assets/i18n/*.json` are
  untouched and ready — see the comment block at the top of `app.config.ts`
  for the exact 3-step re-enable process.
