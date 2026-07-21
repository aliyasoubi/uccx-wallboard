# Configuration guide

How to point the app at a real backend/database address, how runtime
config works, what to do when a backend field gets renamed, and how the
poll interval works. See README.md §3 for the BFF architecture this
builds on.

## 1. Two layers of config

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

`assets/config.json` holds the two values most likely to change on a
deployed server without a rebuild:

```json
{
  "apiBaseUrl": "assets/fixtures",
  "pollIntervalMs": 3000
}
```

This is loaded by `AppConfigService` via an `APP_INITIALIZER` in
`app.config.ts` before the app renders. `BffClientService` (API address)
and `PollingDataSource` (poll interval) both read from it.

## 2. Pointing at a real backend/DB — no rebuild required

1. Edit `src/assets/config.json` on the deployed server (or in
   `src/assets/` before building):
   ```json
   {
     "apiBaseUrl": "https://your-real-bff.example.com/api",
     "pollIntervalMs": 3000
   }
   ```
2. Set `useMockFixtures: false` in the relevant `environment.*.ts` (this
   stays build-time — a deployment-target decision, not something to flip
   at runtime).
3. Refresh the page. No rebuild, no redeploy — just the one JSON file.
4. Check the route paths in `BffClientService`
   (`src/app/core/data-access/bff-client.service.ts`). Each resource has
   a placeholder real-mode path (e.g. `/agents`, `/call-stats`, `/csqs`)
   — update the `realPath` argument in each `this.endpoint(...)` call to
   match the real BFF's actual routes.

Nothing else changes — the mappers, the store, and every component are
already decoupled from where the data comes from.

If the real backend is a database you're standing up yourself, that DB
sits behind the BFF, not behind Angular — the BFF is what should have its
own config for connection strings/credentials. That's a separate service
from this repo.

## 3. A backend field got renamed — what changes?

Always two edits, never more. Example: the backend renames `agentID` to
`agent_id` on `AgentStates`.

1. **Update the DTO** — `src/app/core/models/dto/agent.dto.ts` is the
   only place allowed to know the wire format:
   ```typescript
   export interface AgentStateDto {
     agent_id: string; // was: agentID
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

TypeScript catches any missed usage — changing the DTO field name breaks
the mapper at compile time. No component, template, or fixture other than
the DTO/mapper pair needs to change, since everything downstream only
ever sees the clean domain model.

Adding a **new** field follows the same pattern: add it to the DTO, add
it to the domain model if the UI needs it, map it across in the
corresponding mapper.

## 4. Poll interval

Set in `assets/config.json`'s `pollIntervalMs` (default 3000ms), read by
`PollingDataSource` via `AppConfigService`. Edit the JSON file and
refresh — no rebuild needed.

Each poll fires 6 parallel `HTTP GET`s (one per resource — agents, call
stats, queues, service metrics, agent state counts, agent of month) via
`forkJoin`. At 3s that's fine for a handful of dashboard clients hitting
fixtures or a fast BFF; if this scales to many simultaneous wallboards
against a real BFF, that's the point to prioritize the WebSocket phase
(README.md §3.3) instead of tuning the interval further.
