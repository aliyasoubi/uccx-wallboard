# CCCX Call Center Dashboard — Claude Code Instructions

Angular 18 standalone-component wallboard. Read this before making any
change. Full reference: `docs/ARCHITECTURE.md` (this file summarizes the
rules; that file has the "why"). History of past passes:
`docs/CHANGELOG.md` — don't add new changelog-style entries here or to
ARCHITECTURE.md; if a change is significant, add it to
`docs/CHANGELOG.md` instead.

## Stack (do not deviate without asking)

- Angular 18, **standalone components only** — no NgModules.
- TypeScript `strict: true`.
- State = **Angular Signals in injectable services**. No NgRx. Do not
  introduce a new state library.
- Live data = polling behind the `DataSource` interface
  (`core/data-access/data-source.token.ts`). Never call HTTP directly
  from a component or the store — always through `DataSource`.
- Backend = BFF only. Never point components/services at a raw
  telephony/reporting endpoint.
- Runtime config = `assets/config.json` via `AppConfigService`
  (`APP_INITIALIZER`). `apiBaseUrl`, `pollIntervalMs`, and the
  `thresholds` block come from `AppConfigService.config()`, NOT
  `environment.ts`. `useMockFixtures` IS a build-time `environment.ts`
  flag — leave that one alone.
- Styling = SCSS + CSS custom properties in `shared/styles/_tokens.scss`
  and `_typography.scss`. **Never hardcode a color, spacing value, or
  font size in a component.** Use the tokens.
- Testing = Jasmine/Karma. `npm test` (interactive) / `npm run test:ci`
  (headless). Lint = `npm run lint`.

## Component rules

- Every dashboard module component: `ChangeDetectionStrategy.OnPush`,
  signal `input()`s, standalone.
- Only `DashboardComponent` reads the store directly. Every other
  component receives data via `input()` — never inject the store into
  a leaf component.
- Shared primitives (`MetricTileComponent`, `StatusBadgeComponent`,
  `MeterComponent`, `AgentStateDonutComponent`, `FormatDurationPipe`)
  must stay free of HTTP/store knowledge. If a component needs to fetch
  data, it's not a shared primitive anymore — don't put fetching logic
  in these files.
- **Top Inbound Agent and Top Outbound Agent are two separate
  components** (`TopInboundAgentComponent`, `TopOutboundAgentComponent`
  — own selectors `app-top-inbound-agent` / `app-top-outbound-agent`,
  own files, own specs), NOT one component parameterized by a
  `direction` input. They share tracker-wiring logic via an abstract
  `@Directive()` base, `TopAgentBase`
  (`features/dashboard/components/top-agent-base/`). If a task
  description says "one `app-top-agent` component with a direction
  input," that's stale — follow the actual two-component structure.
- **They are rendered inside one shared card**, `TopAgentsComponent`
  (`app-top-agents`), which owns the card chrome and the "Top Agents
  (Inbound & Outbound)" title; the two children render as bare columns
  with a direction-tinted left accent border. This is a presentational
  wrapper only — it does NOT merge them, and `DashboardComponent`
  composes `app-top-agents` rather than the two children directly. Both
  the "one visual card" requirement and the "two separate components"
  rule above hold at the same time; don't collapse them into one
  component to satisfy the layout.
- `@Directive()` on `TopAgentBase` is required, not optional — Angular
  only registers a base class's `input()`s for template binding if it's
  been processed as a Directive/Component. Removing the decorator
  builds but fails template type-checking (`NG8002`) in every subclass.
- `TopAgentTracker` is a plain class, intentionally NOT a DI singleton
  — each Top Inbound/Outbound Agent component owns its own instance via
  `TopAgentBase`. Don't "fix" this into a shared service; the isolation
  is deliberate.
- Every panel: `:host { display: block; height: 100%; }` — except Call
  Summary Displays and KPI Metrics, which deliberately do NOT get
  `height: 100%` (a `flex: 0 0 auto` band with a forced `height: 100%`
  child creates a circular sizing bug — see `docs/CHANGELOG.md` Pass 1).

## Signals gotchas — read before touching effect()/computed()

1. Never write to a signal from inside `computed()` — Angular throws
   `NG0600`. Do stateful construction/mutation inside `effect()`.
2. Don't expose derived state as
   `computed(() => x?.y() ?? fallback)` when `x` starts null/undefined
   — the `?.` short-circuit on the first read means Angular records
   zero dependencies and freezes the result forever, even after `x`
   becomes populated. Write into a plain owned `signal()` from an
   `effect()` instead. (`TopAgentBase` is the reference implementation
   of the correct pattern.)

## Thresholds / severity

- All SLA/CSAT/FCR/abandon/wait thresholds live in
  `core/policies/status-thresholds.policy.ts`, sourced from
  `assets/config.json`'s `thresholds` block. Use
  `getSeverity()` / `getInverseSeverity()` / `getRatioSeverity()`.
  Never inline a threshold number in a component.

## Queue Displays — per-queue, not aggregated

`QueueListComponent` takes a single `Queue` via its `queue` input and
renders that queue's own nine parameters (Inbound, Handled, In Queue,
Abandons, CWD, MAD, ACT, Ready Agents, SLA) directly — no cross-queue
sum/max/weighted-average math. `DashboardComponent` renders one
`app-queue-list` per entry in `store.queues()`, so each queue
(Sales/Support/Billing) gets its own panel. This replaced an earlier
aggregated design — see `docs/CHANGELOG.md` Pass 9 if a task references
cross-queue aggregation math, since that description is now stale.

## Layout

- `.dashboard { height: 100dvh; overflow: hidden; }` — no page scroll
  above 1000px width. Below 1000px, columns stack and scrolling
  re-enables. Agent Summary (col 3) is the only internally-scrolling
  panel.
- Use `fr`/`flex` proportions, never fixed pixel widths for layout.

## Known-provisional fields — flag, don't assume

These are mocked/guessed pending real backend contract. If a task
touches them, call it out explicitly instead of silently treating the
current definition as final:

- `CustomerServiceMetricsDto.fcr` / `ServiceMetrics.fcrPercent` (FCR
  definition unconfirmed)
- `QueueTimingStatsDto`: CWD, MAD, ACT (assumed meanings, unconfirmed)
- `CsqDto.serviceMetrics` (per-queue SLA shape unconfirmed)
- Queue list currently fixed to Sales/Support/Billing fixture data

## Before you write code

1. State the plan (files to touch, approach) before editing anything
   non-trivial — don't just start editing multi-file changes.
2. Check `status-thresholds.policy.ts` and `_tokens.scss` before adding
   any number or color.
3. Check `docs/ARCHITECTURE.md` §1 for the actual component structure
   of the module you're touching before assuming a doc-described shape
   is current — this repo has drifted from its docs before (see
   Top Inbound/Outbound Agent above).
4. If a change touches a provisional field above, say so.

## After you write code

- Run `npm run test:ci` before calling a task done.
- New components need specs alongside them (match existing coverage
  style — see `SETUP.md`).
- If the change is significant enough to explain to a future reader,
  add an entry to `docs/CHANGELOG.md` — don't leave history-only notes
  in `docs/ARCHITECTURE.md` or here.
