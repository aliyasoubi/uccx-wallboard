# Call Center Dashboard — Architecture & Module Reference

Angular 18 standalone-component wallboard for a call center: signals-based
state, a mapper layer that isolates the app from backend contract drift,
and a runtime-configurable API endpoint.

## 1. Module mapping

| # | Module | Selector | Path |
|---|---|---|---|
| 1 | Call Summary Displays (Incoming/Outbound/Answered/Abandoned) | `app-call-summary-displays` | `features/dashboard/components/call-summary-displays/` |
| 2 | Top Inbound Agent | `app-top-agent` (`direction="inbound"`) | `features/dashboard/components/top-agent/` |
| 3 | Top Outbound Agent | `app-top-agent` (`direction="outbound"`) | `features/dashboard/components/top-agent/` |
| 4 | Agent Summary | `app-agent-summary` | `features/dashboard/components/agent-summary/` |
| 5 | Agent of the Month | `app-agent-of-month` | `features/dashboard/components/agent-of-month/` |
| 6 | Agent State | `app-agent-state` | `features/dashboard/components/agent-state/` |
| 7 | SLA Gauge | `app-sla-gauge` | `features/dashboard/components/sla-gauge/` |
| 8 | Customer Satisfaction | `app-customer-satisfaction-gauge` | `features/dashboard/components/customer-satisfaction-gauge/` |
| 9 | KPI Metrics (FCR/AWD/AHT) | `app-kpi-metrics` | `features/dashboard/components/kpi-metrics/` |
| 10 | Queue Displays (Inbound/Handled/In Queue/Abandons/CWD/MAD/ACT/Ready Agents/SLA) | `app-queue-list` (`variant="waiting"` / `variant="serving"`) | `features/dashboard/components/queue-list/` |
| 11 | Header (Title/Clock/Date) | `app-header` | `features/dashboard/components/header/` |
| 12 | Footer (System Status/Last Update) | `app-footer` | `features/dashboard/components/footer/` |

Shared, non-feature-specific primitives (no HTTP/store knowledge, reused
across modules): `MetricTileComponent`, `StatusBadgeComponent`,
`MeterComponent`, `AgentStateDonutComponent`, `FormatDurationPipe`.

## 2. Tech stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Angular 18, standalone components, no NgModules | Less ceremony |
| Language | TypeScript, `strict: true` | Prevents DTO/contract drift |
| State | Angular Signals in injectable services (no NgRx) | Small set of live resources — signals keep it simple |
| Live data | Polling behind a swappable `DataSource` interface | A WebSocket upgrade later is a contained, isolated change |
| Backend | BFF (Backend-for-Frontend) layer | Frontend never talks directly to the raw telephony/reporting system |
| Runtime config | `assets/config.json`, loaded via `APP_INITIALIZER` | API address / poll interval editable on a deployed server, no rebuild |
| Styling | SCSS + CSS custom properties as design tokens | Single palette/type-scale source of truth |
| Testing | Jasmine/Karma | See §5 |

## 3. Architecture

### 3.1 Backend — BFF, not direct-to-source

The frontend never calls raw telephony/reporting endpoints directly.
`BffClientService` stands in for a Backend-for-Frontend that owns
normalization, aggregation, and polling of the source system. It currently
reads static JSON fixtures (`useMockFixtures: true`); pointing it at a
real BFF is a config change — see CONFIGURATION.md.

### 3.2 Runtime configuration

`app.config.ts` registers an `APP_INITIALIZER` that loads
`assets/config.json` via `AppConfigService` before the app renders.
`BffClientService` (API base URL) and `PollingDataSource` (poll interval)
both read from `AppConfigService.config()`, not from the compiled
`environment.ts`. `useMockFixtures` stays a build-time `environment.ts`
flag (it decides whether a deployment target talks to fixtures at all);
`apiBaseUrl` and `pollIntervalMs` are editable at runtime by editing
`assets/config.json` and refreshing. Full instructions in
CONFIGURATION.md.

### 3.3 Data layer — DataSource abstraction

The store depends only on the `DataSource` interface
(`core/data-access/data-source.token.ts`). `PollingDataSource` is the
only implementation today; a future `WebSocketDataSource` is a one-line
provider swap in `app.config.ts` — nothing in the store, mappers, or
components changes.

### 3.4 Status/severity policy

`core/policies/status-thresholds.policy.ts` is the single place threshold
numbers live (SLA, CSAT, FCR, abandon ratio, wait times, etc.).
Components call `getSeverity()` / `getInverseSeverity()` /
`getRatioSeverity()` rather than hardcoding thresholds inline.

### 3.5 Component design

- Every dashboard module (§1) is a standalone component,
  `ChangeDetectionStrategy.OnPush`, with signal `input()`s. Only
  `DashboardComponent` (the shell) reads the store; every other module
  receives data via inputs.
- `TopAgentTracker` (`core/state/top-agent-tracker.ts`) is a plain class,
  not a DI singleton — each Top Inbound/Outbound Agent widget owns its
  own instance, so there's no shared mutable state between modules. It
  tracks a running high-water mark (only rises, resets every 24h) and
  persists to `localStorage` so a page refresh doesn't lose the day's
  max.
- Design tokens (`shared/styles/_tokens.scss`, `_typography.scss`) are
  the only source of colors/spacing/type — nothing hardcoded
  per-component.

### 3.6 Queue Displays aggregation

`QueueListComponent` shows one aggregated set of all nine required
parameters (Inbound, Handled, In Queue, Abandons, CWD, MAD, ACT, Ready
Agents, SLA) across every queue, as a single-column list — not broken
down by individual queue name. The aggregation rule depends on the
parameter:

- **Counts** (Inbound, Handled, In Queue, Abandons, Ready Agents):
  summed across queues.
- **CWD, MAD** (worst-case wait/abandon durations): the **max** across
  queues — summing or averaging a "longest wait" is meaningless; the
  board should surface the single longest one, wherever it's currently
  happening.
- **ACT, SLA** (rates/averages): a **call-volume-weighted average** — a
  queue with 900 calls shouldn't count equally to one with 100 calls.

### 3.7 Layout — fixed 3-column wallboard, no page scroll

The dashboard fills exactly one viewport (any HD–4K display) with no
page-level scrollbar:

- `.dashboard { height: 100dvh; overflow: hidden; }` — nothing can grow
  taller than the viewport.
- Every row/column uses `fr`/`flex` proportions, not fixed pixels, so the
  layout reflows correctly at any resolution.
- Each panel component declares `:host { display: block; height: 100%; }`
  so custom elements (which default to `display: inline`) size correctly
  inside CSS grid/flex.
- **Agent Summary** (column 3) is the one exception: an agent roster is
  unbounded, so that list scrolls internally if long — the page itself
  still never scrolls.
- Below 1000px width, columns stack to one and page scrolling is
  re-enabled (the no-scroll guarantee is a desktop/kiosk-monitor promise,
  not a mobile one).

Column layout:

- **Column 1**: Call Summary Displays → Top Inbound/Outbound Agent →
  SLA/CSAT gauges → KPI Metrics
- **Column 2**: Waiting Queue / Serving Queue (side by side) → Agent
  State / Agent of the Month (side by side)
- **Column 3**: Agent Summary (full height)

## 4. Multi-language (Farsi + English, RTL)

Built (Transloco + `en`/`fa` translation files + RTL toggle) but not
wired into this release. See the comment block at the top of
`app.config.ts` for the re-enable steps.

## 5. Testing

109 Jasmine/Karma specs covering mappers, the severity policy,
`TopAgentTracker`/`TopAgentComponent`, `AppConfigService`,
`PollingDataSource` (error/backoff behavior), `DashboardStoreService`, and
dashboard components. Run with `npm test` (interactive) or
`npm run test:ci` (headless, CI-friendly). See SETUP.md for detailed
coverage.

## 6. Open items / documented assumptions

Fields where a name, definition, or acronym meaning was mocked or assumed
because no real backend contract exists yet. Each is flagged with a
`PROVISIONAL` comment at its source — confirm with the backend/BFF team
before go-live:

- **FCR** (`CustomerServiceMetricsDto.fcr`, `ServiceMetrics.fcrPercent`)
  — no real backend field exists yet; confirm the real definition
  (single-contact vs. same-day resolution) and field name.
- **CWD / MAD / ACT** (`QueueTimingStatsDto`) — assumed meanings:
  - CWD = Current Wait Duration (longest caller waiting right now)
  - MAD = Max Abandon Duration (longest wait before an abandon)
  - ACT = Average Call Time (average total handled-call duration)

  Confirm these against the real UCCX/BFF contract.
- **Per-queue SLA** (`CsqDto.serviceMetrics`) — shape is unconfirmed
  against a real backend.
- **Queue list** — still `Sales`, `Support`, `Billing` from the fixture;
  confirm the full CSQ list isn't fixed at three.

## 7. Roadmap

1. Confirm the open items in §6 against a real backend contract.
2. Wire `WebSocketDataSource` once the BFF supports push (§3.3) — no
   frontend rework needed beyond the provider swap.
3. Re-enable Transloco (§4) once language requirements are confirmed.
4. Add Playwright E2E coverage against a real/staging BFF (current tests
   cover the mapper/policy/component layer only).
