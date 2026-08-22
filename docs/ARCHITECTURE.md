# Architecture — CCCX Call Center Dashboard

This is the stable reference for how the app is built and why. It
describes the **current state only**. For "what changed and when," see
`docs/CHANGELOG.md` — don't mix history back into this file.

Related docs: `SETUP.md` (run it), `CONFIGURATION.md` (point it at a
real backend), `docs/CHANGELOG.md` (history).

## 1. Module mapping

| #   | Module                                                                          | Selector(s)                                                   | Path                                                         |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | Call Summary Displays (Incoming/Outbound/Answered/Abandoned)                    | `app-call-summary-displays`                                   | `features/dashboard/components/call-summary-displays/`       |
| 2   | Top Inbound Agent                                                               | `app-top-inbound-agent`                                       | `features/dashboard/components/top-inbound-agent/`           |
| 3   | Top Outbound Agent                                                              | `app-top-outbound-agent`                                      | `features/dashboard/components/top-outbound-agent/`          |
| 4   | Agent Summary                                                                   | `app-agent-summary`                                           | `features/dashboard/components/agent-summary/`               |
| 5   | Agent of the Month                                                              | `app-agent-of-month`                                          | `features/dashboard/components/agent-of-month/`              |
| 6   | Agent State                                                                     | `app-agent-state`                                             | `features/dashboard/components/agent-state/`                 |
| 7   | SLA Gauge                                                                       | `app-sla-gauge`                                               | `features/dashboard/components/sla-gauge/`                   |
| 8   | Customer Satisfaction                                                           | `app-customer-satisfaction-gauge`                             | `features/dashboard/components/customer-satisfaction-gauge/` |
| 9   | KPI Metrics (FCR/AWD/AHT)                                                       | `app-kpi-metrics`                                             | `features/dashboard/components/kpi-metrics/`                 |
| 10  | Queue Displays (Inbound/Handled/In Queue/Abandons/CWD/MAD/ACT/Ready Agents/SLA) | `app-queue-list` (one instance per queue via `[queue]` input) | `features/dashboard/components/queue-list/`                  |
| 11  | Header (Title/Clock/Date)                                                       | `app-header`                                                  | `features/dashboard/components/header/`                      |
| 12  | Footer (System Status/Last Update)                                              | `app-footer`                                                  | `features/dashboard/components/footer/`                      |

**Modules 2/3 are two separate components, not one parameterized
component.** `TopInboundAgentComponent` and `TopOutboundAgentComponent`
each have their own selector, file, and spec. They share their
tracker-wiring logic via an abstract `@Directive()` base class,
`TopAgentBase` (`features/dashboard/components/top-agent-base/`), which
provides the shared template/styles and the effect-driven tracker logic.
`@Directive()` (not a plain class) is required here — Angular's compiler
only registers a base class's `input()` properties for template binding
if that class has itself been processed as a Directive or Component;
skipping this decorator builds fine but fails template type-checking in
every subclass (`NG8002`).

Shared, non-feature-specific primitives (no HTTP/store knowledge, reused
across modules): `MetricTileComponent`, `StatusBadgeComponent`,
`MeterComponent`, `AgentStateDonutComponent`, `FormatDurationPipe`.

## 2. Tech stack

| Concern        | Choice                                             | Rationale                                                                          |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Framework      | Angular 18, standalone components, no NgModules    | Less ceremony                                                                      |
| Language       | TypeScript, `strict: true`                         | Prevents DTO/contract drift                                                        |
| State          | Angular Signals in injectable services (no NgRx)   | Small set of live resources — signals keep it simple                               |
| Live data      | Polling behind a swappable `DataSource` interface  | A WebSocket upgrade later is a contained, isolated change                          |
| Backend        | BFF (Backend-for-Frontend) layer                   | Frontend never talks directly to the raw telephony/reporting system                |
| Runtime config | `assets/config.json`, loaded via `APP_INITIALIZER` | API address / poll interval / thresholds editable on a deployed server, no rebuild |
| Styling        | SCSS + CSS custom properties as design tokens      | Single palette/type-scale source of truth                                          |
| Testing        | Jasmine/Karma                                      | See §6                                                                             |
| Tooling        | Angular CLI (esbuild), ESLint (`npm run lint`)     | Standard, low-maintenance                                                          |

## 3. Backend — BFF, not direct-to-source

The frontend never calls raw telephony/reporting endpoints directly.
`BffClientService` stands in for a Backend-for-Frontend that owns
normalization, aggregation, and polling of the source system. It
currently reads static JSON fixtures (`useMockFixtures: true`); pointing
it at a real BFF is a config change — see `CONFIGURATION.md`.

### 3.1 Runtime configuration

`app.config.ts` registers an `APP_INITIALIZER` that loads
`assets/config.json` via `AppConfigService` before the app renders.
`BffClientService` (API base URL) and `PollingDataSource` (poll
interval) both read from `AppConfigService.config()`, not from the
compiled `environment.ts`. `useMockFixtures` stays a build-time
`environment.ts` flag; `apiBaseUrl`, `pollIntervalMs`, and the
`thresholds` block are all runtime-editable via `assets/config.json`.
Full instructions in `CONFIGURATION.md`.

## 4. Data layer — DataSource abstraction

The store depends only on the `DataSource` interface
(`core/data-access/data-source.token.ts`). `PollingDataSource` is the
only implementation today; a future `WebSocketDataSource` is a one-line
provider swap in `app.config.ts` — nothing in the store, mappers, or
components changes.

## 5. Status/severity policy

`core/policies/status-thresholds.policy.ts` is the single place
threshold numbers live (SLA, CSAT, FCR, abandon ratio, wait times,
etc.), sourced from `assets/config.json`'s `thresholds` block.
Components call `getSeverity()` / `getInverseSeverity()` /
`getRatioSeverity()` rather than hardcoding thresholds inline.

## 6. Component design

- Every dashboard module (§1) is a standalone component,
  `ChangeDetectionStrategy.OnPush`, with signal `input()`s. Only
  `DashboardComponent` (the shell) reads the store; every other module
  receives data via inputs.
- `TopAgentTracker` (`core/state/top-agent-tracker.ts`) is a plain
  class, not a DI singleton — each Top Inbound/Outbound Agent component
  constructs and owns its own instance via `TopAgentBase` (see §1), so
  there's no shared mutable state between the two modules. It tracks a
  running high-water mark (only rises, resets every 24h) and persists to
  `localStorage` so a page refresh doesn't lose the day's max.
- Design tokens (`shared/styles/_tokens.scss`, `_typography.scss`) are
  the only source of colors/spacing/type — nothing hardcoded
  per-component.

### 6.1 Signals gotchas (learned the hard way — see `docs/CHANGELOG.md`)

Two runtime bugs from building `TopAgentBase`, worth knowing before
touching signal/effect code anywhere in this app:

1. **Never write to a signal from inside a `computed()`.** Angular
   throws `NG0600`. Construct/mutate stateful things like
   `TopAgentTracker` inside an `effect()` instead.
2. **Don't expose derived state as `computed(() => x?.y() ?? fallback)`
   when `x` starts out null/undefined.** On the first evaluation the
   `?.` short-circuits before reading any signal, so Angular records
   zero dependencies and treats the result as constant forever — it
   will never recompute even after `x` becomes populated. Have the
   effect write into a plain owned `signal()` instead.

## 7. Testing

Jasmine/Karma specs cover mappers, the severity policy,
`TopAgentTracker`/`TopAgentBase`, `AppConfigService`, `PollingDataSource`
(error/backoff behavior), `DashboardStoreService`, and dashboard
components. Run with `npm test` (interactive) or `npm run test:ci`
(headless, CI-friendly, with coverage). See `SETUP.md` for what's
real vs. mocked.

## 8. Multi-language (Farsi + English, RTL)

Built (Transloco + `en`/`fa` translation files + RTL toggle) but not
wired into this release — the imports and provider are present but
commented out in `app.config.ts`, which also documents the exact
3-step re-enable process.

## 9. Layout — fixed 3-column wallboard, no page scroll

The dashboard fills exactly one viewport (any HD–4K display) with no
page-level scrollbar:

- `.dashboard { height: 100dvh; overflow: hidden; }` — nothing can grow
  taller than the viewport.
- Every row/column uses `fr`/`flex` proportions, not fixed pixels, so
  the layout reflows correctly at any resolution.
- Each panel component declares `:host { display: block; height: 100%; }`
  so custom elements (which default to `display: inline`) size
  correctly inside CSS grid/flex. The two content-sized bands (Call
  Summary Displays, KPI Metrics) deliberately do **not** get
  `height: 100%` — see `docs/CHANGELOG.md` for the circular-sizing bug
  that taught us this.
- **Agent Summary** (column 3) is the one panel with inherently unbounded
  content. It does **not** scroll internally — rows instead shrink to fit
  whatever height the panel has (`flex: 1` per row, capped by a
  `max-height`), so N agents always exactly fill the space rather than a
  scrollbar hiding the rows that don't fit. See
  `agent-summary.component.scss` for the trade-off that implies at very
  large roster sizes, and `docs/CHANGELOG.md` Pass 8 for why internal
  scrolling was replaced with shrink-to-fit.
- Below 1000px width, columns stack to one and page scrolling is
  re-enabled (the no-scroll guarantee is a desktop/kiosk-monitor
  promise, not a mobile one).

Column layout:

- **Column 1**: Call Summary Displays → Top Inbound/Outbound Agent →
  SLA/CSAT gauges → KPI Metrics
- **Column 2**: One Queue Displays panel per queue (Sales/Support/
  Billing) → Agent State / Agent of the Month (side by side)
- **Column 3**: Agent Summary (full height)

## 10. Queue Displays — per-queue, not aggregated

`QueueListComponent` takes a single `Queue` via its `queue` input and
renders that one queue's own nine parameters (Inbound, Handled, In
Queue, Abandons, CWD, MAD, ACT, Ready Agents, SLA) as a single-column
list, straight off the input — no cross-queue math. `DashboardComponent`
`@for`-loops `store.queues()` and renders one `app-queue-list` per
queue, so each queue (Sales/Support/Billing) gets its own panel with its
own title (`queue.name`).

This replaces an earlier aggregated design (sum/max/weighted-average
across all queues into one "Waiting Queue"/"Serving Queue" pair — see
`docs/CHANGELOG.md` Pass 3–4 and Pass 9) — confirm with the contributor/
product owner whether dropping the cross-queue aggregation was
intentional. `Queue`, `CsqDto`, and `queue.mapper.ts` are unaffected;
this is a presentation-layer change only.

## 11. Open items / documented assumptions

Fields where a name, definition, or acronym meaning was mocked or
assumed because no real backend contract exists yet. Each is flagged
with a `PROVISIONAL` comment at its source — confirm with the
backend/BFF team before go-live:

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

## 12. Roadmap

1. Confirm the open items in §11 against a real backend contract.
2. Wire `WebSocketDataSource` once the BFF supports push (§4) — no
   frontend rework needed beyond the provider swap.
3. Re-enable Transloco (§8) once language requirements are confirmed.
4. Add Playwright E2E coverage against a real/staging BFF (current
   tests cover the mapper/policy/component layer only).
