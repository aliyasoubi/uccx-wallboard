# Call Center Dashboard — Architecture & Module Reference

This document describes the CCCX call center wallboard as it exists in this
repo today: a standalone-component Angular 18 app, signals-based state, a
mapper layer that isolates the app from backend contract drift, and a
runtime-configurable API endpoint. It replaces an earlier
React/Vite implementation. All metrics (calls summary, agent states,
SLA/CSAT/FCR, per-queue breakdown, agent roster, agent of the month, top
performers) are preserved or extended — see §11 for exactly what changed in
this pass and why.

## 1. Required-module mapping

The dashboard is composed of the 12 modules below. This table is the answer
to "map existing components to the target module names": what each module
used to be called, where it lives now, and what changed.

| # | Required module | Selector | Path | Mapped from |
|---|---|---|---|---|
| 1 | Call Summary Displays (Abandoned/Incoming/Outbound/Answered) | `app-call-summary-displays` | `features/dashboard/components/call-summary-displays/` | Renamed & refocused from `CallsSummaryPanelComponent`. AWD/AHT moved out to KPI Metrics (module 9) — see §11.2. Each tile carries a related Tabler icon (§13.3) |
| 2 | Top Inbound Agent | `app-top-agent` (direction="inbound") | `features/dashboard/components/top-agent/` | New. Backed by `core/state/top-agent-tracker.ts` |
| 3 | Top Outbound Agent | `app-top-agent` (direction="outbound") | same component, `direction` input | New — same component as #2, DRY over two near-duplicates, matching the existing inbound/outbound pattern in this codebase |
| 4 | Agent Summary | `app-agent-summary` | `features/dashboard/components/agent-summary/` | Renamed from `AgentRosterComponent`. See §11.4 for the "only first row" investigation |
| 5 | Agent of the Month | `app-agent-of-month` | `features/dashboard/components/agent-of-month/` | Moved from `shared/components/agent-of-month-card/` — it's a dashboard-specific feature panel, not a generic reusable primitive |
| 6 | Agent State | `app-agent-state` | `features/dashboard/components/agent-state/` | New wrapper. The donut itself (`AgentStateDonutComponent`) stays a generic shared primitive; this component is the title+layout wrapper that used to be written inline in `dashboard.component.html` |
| 7 | SLA Gauge | `app-sla-gauge` | `features/dashboard/components/sla-gauge/` | Split out of `ServiceMetricsPanelComponent`, which bundled SLA + CSAT + calls-waiting into one panel |
| 8 | Customer Satisfaction | `app-customer-satisfaction-gauge` | `features/dashboard/components/customer-satisfaction-gauge/` | Split out of `ServiceMetricsPanelComponent`, alongside #7 |
| 9 | KPI Metrics (FCR/AWD/AHT) | `app-kpi-metrics` | `features/dashboard/components/kpi-metrics/` | New. AWD/AHT relocated here from the old calls-summary panel; FCR is new (mocked — see §11.3). Also keeps the "calls in queue" tile that used to live on `ServiceMetricsPanelComponent` |
| 10 | Queue Displays (Inbound/Handled/In Queue/Abandons/CWD/MAD/ACT/Ready Agents/SLA) | `app-queue-list` (variant="waiting" / variant="serving") | `features/dashboard/components/queue-list/` | Renamed from `QueuePanelComponent`, extended with CWD/MAD/ACT/SLA (§11.1), then reshaped into two panels that each show one aggregated set of all nine parameters as a single-column list (no per-queue breakdown) — see §12.1/§15 |
| 11 | Header (Title/Clock/Date) | `app-header` | `features/dashboard/components/header/` | New. The old inline `<header>` in `dashboard.component.html` only had the live-connection indicator, which moved to Footer (#12) |
| 12 | Footer (System Status/Last Update) | `app-footer` | `features/dashboard/components/footer/` | New — carries the live/stale/error indicator that used to be in the dashboard shell's `<header>`, unchanged in behavior, just relocated to its own module |

Shared, non-feature-specific primitives (no HTTP/store knowledge, reused by
several of the modules above) are unchanged in role: `MetricTileComponent`,
`StatusBadgeComponent`, `MeterComponent`, `AgentStateDonutComponent`,
`FormatDurationPipe`.

`CallDirectionPanelComponent` (the old "Inbound calls / Outbound calls, top
agent, lowest agent" panel) was retired, not silently deleted: its call-count
responsibility moved into Call Summary Displays (#1) and its "top agent"
concept was replaced by the more precise Top Inbound/Outbound Agent modules
(#2/#3), which track a running high-water mark instead of a single tick's
value — see §11.5.

## 2. Tech stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Angular 18, standalone components, no NgModules | Less ceremony for new joiners |
| Language | TypeScript, `strict: true`, no implicit `any` | Prevents DTO/contract drift |
| State | Angular Signals in injectable services (no NgRx) | Dashboard state is a handful of live resources — signals keep it simple and debuggable |
| Live data | Polling, behind a swappable `DataSource` interface — see §4 | Keeps today's solution simple while making a WebSocket upgrade a contained, later change |
| Backend | BFF (Backend-for-Frontend) layer — see §3 | Frontend never talks directly to the raw telephony/reporting system |
| Runtime config | `assets/config.json`, loaded by `AppConfigService` via `APP_INITIALIZER` | Lets ops repoint the API/DB address or change the poll interval by editing one file on the server — no rebuild. See §3.1 and CONFIGURATION.md |
| Styling | SCSS + CSS custom properties as design tokens, logical properties | Single palette/type-scale source of truth; RTL-ready |
| Testing | Jasmine/Karma | See §7 |
| Tooling | Angular CLI (esbuild), ESLint, Prettier | Standard, low-maintenance |
| Config | `environment.ts` (build-time) + `config.json` (runtime) | See §3.1 |

## 3. Backend — BFF, not direct-to-source

The frontend does not call raw telephony/reporting endpoints directly.
`BffClientService` stands in for a Backend-for-Frontend that would own
normalization, aggregation, and the actual polling of the source system in
a production deployment. Today it reads static JSON fixtures
(`useMockFixtures: true`); pointing it at a real BFF is a config change, not
a code change — see §3.1 and CONFIGURATION.md.

### 3.1 Runtime configuration — now implemented

Earlier drafts of this app shipped an `AppConfigService` and
`assets/config.json` that were never actually wired into the app — editing
`config.json` silently did nothing, and the real values came from the
compiled-in `environment.ts`. That's fixed:

- `app.config.ts` registers an `APP_INITIALIZER` that calls
  `AppConfigService.load()` before the app renders.
- `BffClientService.base` and `PollingDataSource`'s poll interval now read
  from `AppConfigService.config()` (backed by `assets/config.json`) instead
  of the static `environment.ts` import.
- `useMockFixtures` stays a build-time `environment.ts` concern (it decides
  whether this deployment target talks to fixtures at all) — everything
  else (`apiBaseUrl`, `pollIntervalMs`) is now editable on a deployed server
  by editing `assets/config.json` and refreshing the page.

See CONFIGURATION.md for the exact steps to point this at a real backend.

## 4. Data layer — DataSource abstraction (polling now, WebSocket later)

Unchanged from the original design: the store depends only on the
`DataSource` interface (`core/data-access/data-source.token.ts`).
`PollingDataSource` is the only implementation today; swapping in a future
`WebSocketDataSource` is a one-line change in `app.config.ts` — nothing in
the store, mappers, or components changes.

## 5. Status/severity — one policy, not N inline conditionals

`core/policies/status-thresholds.policy.ts` is still the only place
threshold numbers live. This pass added two more metrics to it: `fcrPercent`
(inverse — lower is worse, like SLA) and `currentWaitSeconds` (CWD, for the
Queue Displays module).

## 6. Component design

- Every dashboard module (§1) is a standalone component with a single
  responsibility, `ChangeDetectionStrategy.OnPush`, and signal `input()`s —
  no module reads the store or makes HTTP calls directly except
  `DashboardComponent` (the shell), which only reads `DashboardStoreService`
  and passes data down.
- `TopAgentTracker` (`core/state/top-agent-tracker.ts`) is a plain,
  independently unit-tested class, not a DI singleton — each Top
  Inbound/Outbound Agent widget constructs and owns its own instance, so
  there's no shared mutable state between those two modules (or any other
  module). It persists to `localStorage` so a page refresh mid-shift
  doesn't lose the day's running max.
- Design tokens (`shared/styles/_tokens.scss`, `_typography.scss`) are
  unchanged — every new component reads colors/spacing from there, nothing
  hardcoded per-component.

## 7. Testing

109 Jasmine/Karma specs across mappers, the severity policy, the new
`TopAgentTracker`/`TopAgentComponent`, `AppConfigService`, `PollingDataSource`
(error/backoff behavior), `DashboardStoreService`, and every new/changed
component. Priority followed SETUP.md's own list (mappers, policy,
`PollingDataSource`, `AgentStateDonutComponent`'s segment math) plus
regression coverage for the two things explicitly flagged in this round:
the Agent Summary list-rendering behavior (§11.4) and the new tracker's
dynamic-max/24h-reset logic. Run with `npm test` (interactive) or
`npm run test:ci` (headless, single run, with coverage).

Two real bugs were caught by actually *running* the suite (not just
type-checking) and are worth calling out because they're the kind of thing
that only shows up at runtime:
- `TopAgentComponent` initially threw `NG0600` (writing to a signal from
  inside a `computed()`), from constructing the tracker lazily inside a
  `computed()` read.
- After fixing that, the same component's `top` value froze at `null`
  forever: a `computed(() => this.trackerInstance?.top() ?? null)`
  short-circuits via `?.` on its *first* evaluation (before the tracker
  exists), so it records zero reactive dependencies that time — Angular
  then treats it as constant and never recomputes it, even after the
  tracker is later populated. Fixed by having the effect write into a
  plain owned `signal()` instead of a conditionally-dependent `computed()`.

## 8. Multi-language (Farsi + English, RTL)

Unchanged — still built (Transloco + `en`/`fa` translation files + RTL
toggle) but intentionally not wired into this release. See the comment
block at the top of `app.config.ts` for the 3-step re-enable process.

## 9. Open items / documented assumptions

These are places where a field name, definition, or acronym meaning was
**mocked or assumed** because no real backend contract exists yet. Each is
also flagged with a `PROVISIONAL` comment at its source in the code —
confirm with the real backend/BFF team before go-live:

- **FCR** (`CustomerServiceMetricsDto.fcr`, `ServiceMetrics.fcrPercent`) —
  no real backend field existed; mocked at 79.8% org-wide / per-queue in
  the fixtures. Confirm the real definition (single-contact vs. same-day
  resolution) and field name.
- **CWD / MAD / ACT** (`QueueTimingStatsDto`, `Queue.currentWaitSeconds` /
  `maxAbandonSeconds` / `avgHandleSeconds`) — assumed meanings, documented
  in `queue.model.ts`:
  - CWD = Current Wait Duration (longest caller waiting right now)
  - MAD = Max Abandon Duration (longest wait before an abandon)
  - ACT = Average Call Time (average total handled-call duration)

  Confirm these acronym definitions and field names against the real UCCX/
  BFF contract.
- **Per-queue SLA** (`CsqDto.serviceMetrics`) — this field was already
  declared on the DTO in an earlier pass but the fixture never actually
  included it and the mapper never read it (contract drift). Both are now
  fixed and the fixture carries real-looking mocked values, but the shape
  itself is still unconfirmed against a real backend.
- **Queue list** — still `Sales`, `Support`, `Billing` from the fixture;
  confirm the full CSQ list isn't fixed at three.
- **`agentOfMonth.photoUrl` fallback** — resolved: `AgentOfMonthComponent`
  renders initials when the photo URL is empty (unchanged from the prior
  pass, still correct).

## 10. Project phases (for future work)

1. Confirm the open items in §9 against a real backend contract.
2. Wire `WebSocketDataSource` once the BFF supports push (§4) — no
   frontend rework needed beyond the provider swap.
3. Re-enable Transloco (§8) once language requirements are confirmed.
4. Add Playwright E2E coverage against a real/staging BFF (unit tests in
   §7 currently cover the mapper/policy/component layer only).

## 11. Changelog — this pass

1. **Queue Displays extended.** Added CWD/MAD/ACT/SLA to `Queue`,
   `CsqDto` gained a `timings` sub-object (`QueueTimingStatsDto`) and its
   already-declared-but-unused `serviceMetrics` field is now actually
   mapped. `CsqStats.json` was rewritten to match (see §9 for the
   mocked-field caveats).
2. **Call Summary Displays refocused to exactly Abandoned/Incoming/
   Outbound/Answered**, per the module spec. The previous panel's AWD
   (avg wait) and AHT (avg talk) tiles were relocated — not dropped — to
   the new KPI Metrics module, where the spec's own acronym list already
   asked for them.
3. **FCR added** as a new KPI, mocked pending a real backend field (§9).
4. **Agent Summary — "only first item works" investigated, not
   reproduced.** Reviewed the `@for`/`track` expression, the OnPush
   change-detection setup, and the full mapper pipeline. Every fixture
   agent renders correctly. Hardened anyway (simplified `track` to a plain
   `agent.id` expression, guarded a blank name) and added a dedicated
   regression test (`agent-summary.component.spec.ts`) asserting all rows
   render, not just the first — if this resurfaces, it's most likely a
   stale build/cache in the browser rather than the application code; that
   test will fail immediately if it's a code regression.
5. **`Agent.inboundCalls` / `Agent.outboundCalls` now mapped.** The
   underlying data (`AgentDto.inboundCallStats.totalCalls` /
   `outboundCallStats.totalCalls`) already existed on the wire but the old
   mapper dropped it — needed to power Top Inbound/Outbound Agent (#2/#3).
6. **Top Inbound Agent / Top Outbound Agent implemented** with genuine
   dynamic-max tracking (only rises, never falls on a quiet poll tick) and
   a 24-hour reset window, per the spec. See `core/state/
   top-agent-tracker.ts` and §7 for the two bugs this caught during
   testing.
7. **Runtime config actually wired up** — see §3.1. This is the fix for
   "configurable feature to change API and its database address easily":
   before this pass, `assets/config.json` existed but had no effect.
8. **Test infrastructure added.** `angular.json` had no `test` target at
   all (`ng test` didn't work); added it, plus `karma.conf.js` and
   `tsconfig.spec.json`, and 109 passing specs — see §7.
9. **`.gitignore` added** — was missing (`node_modules`, `dist`, `coverage`,
   `.angular/cache` were previously untracked-ignore-less).

Existing-functionality preservation: every metric, mapper, and threshold
that existed before this pass still exists and still resolves to the same
values — see the table in §1 for exactly where each one moved to.

## 12. Layout — fixed 3-column wallboard, no page scroll

The dashboard shell (`dashboard.component.scss`) is built to fill exactly
one viewport — HD (1920×1080), 4K (3840×2160), or anything between — with
no page-level scrollbar, and to reflow (not just rescale) at each size
rather than shipping a separate "4K version".

**Structure:**

```
┌─────────────────────────── Header (Title / Clock / Date) ───────────────────────────┐
│  Column 1              │  Column 2                    │  Column 3                    │
│  Call Summary Displays │  Waiting Queue │ Serving Queue│  Agent Summary               │
│  Top Inbound │ Top Out │  (side by side)               │  (fills the whole column)    │
│  SLA Gauge │ CSAT Gauge│  Agent State │ Agent of Month  │                              │
│  KPI Metrics            │  (side by side)              │                              │
├──────────────────── Footer (System Status / Last Update Time) ──────────────────────┤
```

**How "no scroll on any monitor" is enforced, mechanically:**

1. `.dashboard { height: 100dvh; overflow: hidden; }` — the page can never
   grow taller than the viewport, so there's structurally nothing to
   scroll.
2. Every row and column is sized with `fr`/`flex` proportions, never fixed
   pixels — the exact same layout re-flows correctly at 1920×1080 and
   3840×2160 without a breakpoint between them (both are 16:9, so the
   proportions hold). Verified empirically (not just by eyeballing CSS) by
   building the app, serving it, and measuring every panel's
   `getBoundingClientRect()` in a real headless browser at HD, 4K, and a
   1366×768 laptop: `document.documentElement.scrollHeight` equals
   `clientHeight` exactly at all three, and no panel collapses to zero
   height or overflows its band.
3. Each panel component declares `:host { display: block; height: 100%; }`
   (custom elements default to `display: inline`, which is unreliable
   inside CSS grid/flex). The two content-sized bands (Call Summary
   Displays, KPI Metrics) deliberately do **not** get `height: 100%` — an
   earlier draft applied it uniformly and it back-fired: a `flex: 0 0 auto`
   band with a child forcing `height: 100%` creates a circular sizing
   dependency that made Call Summary Displays balloon to fill the entire
   column and starve Top Agent/Gauges/KPI Metrics down to zero height,
   pushed off-screen. Caught by the same headless-browser measurement pass
   in point 2, not by looking at the screenshot alone.
4. **Agent Summary (column 3) is the one deliberate exception.** An agent
   roster is inherently unbounded — there's no `fr`-based trick that
   guarantees 200 agents fit in a fixed-height card. That single list
   scrolls internally (`agent-summary.component.scss`'s `.list`) if the
   roster is long; the page itself still never scrolls. (This also
   surfaced a real flexbox bug: `.list` had `overflow-y: auto` but no
   `flex: 1; min-height: 0`, so it couldn't actually shrink to trigger
   that scroll — fixed.)
5. **Responsive fallback below 1000px width**: the no-scroll guarantee is
   a desktop/kiosk-monitor promise, not a phone-in-portrait one. Below
   1000px, columns stack to one, and page scrolling is explicitly
   re-enabled — verified at tablet (768×1024, fits without scroll) and
   phone (390×844, scrolls as expected) widths.

### 12.1 Queue Displays: two panels, each an aggregate of every queue

`QueueListComponent` backs both "Waiting Queue" and "Serving Queue"
(`variant="waiting"` / `variant="serving"`). Per explicit request, it does
**not** break the board down by individual queue name (Sales/Support/
Billing) — each panel shows one aggregated set of all nine required
parameters (Inbound, Handled, In Queue, Abandons, CWD, MAD, ACT, Ready
Agents, SLA) across every queue, as a single-column list of nine
label/value rows.

Aggregating nine differently-shaped metrics correctly matters — a naive
"sum everything" or "average everything" would quietly misreport several
of them:

- **Counts** (Inbound, Handled, In Queue, Abandons, Ready Agents) are
  **summed** across queues — genuinely additive.
- **CWD, MAD** (the longest current wait / longest historical wait before
  an abandon) are the **max** across queues, not summed or averaged — a
  "total wait time across three queues" is meaningless; what the board
  needs is the single longest one, wherever it's currently happening.
- **ACT, SLA** (an average handle time and a percentage) use a
  **call-volume-weighted average**, not a plain average of the three
  queues' numbers — a queue with 900 calls and a queue with 100 calls
  shouldn't count equally toward the org-wide figure. (Verified with a
  weighted-average test: two queues at 100 and 500 seconds ACT, weighted
  9:1 by volume, aggregate to 140s — not the 300s a plain average would
  give.)

This replaced an earlier per-queue design (`QueueDisplayComponent`, one
card per CSQ) and, before that, a per-queue table row, and briefly a 3x3
stat grid. All were retired for the same underlying reason: a wallboard
fitting a fixed viewport with no scrolling can't keep growing taller as
queues are added, and a single-row table wide enough for all 9 columns
overflowed its panel at realistic widths (reproduced and confirmed at
1512px, where a 7-column version needed 371px but only had 225px
available — the truncated SLA column and horizontal scrollbar in the
original bug report). The current layout is a single vertical column of
nine full-width rows (per explicit request, replacing the grid) — each
row spans the panel's full width, so there is no horizontal packing to
overflow at all; a value can still wrap if it's unusually long, but the
row itself never spills past its panel, at any width. Re-verified after
this layout change at 1512px/HD/4K: zero horizontal overflow, zero page
scroll.

This is a presentation-layer change only — the `Queue` domain model,
`CsqDto`, and `queue.mapper.ts` are exactly as described in §11.1;
`QueueListComponent` computes the aggregate client-side from the same
per-queue data the API already returns.

## 13. Changelog — UI refinement pass

1. **"Resets every 24h" caption removed** from the Top Inbound/Outbound
   Agent cards. The underlying 24-hour reset logic in `TopAgentTracker`
   (§6) is unchanged — this only removed the on-screen caption.
2. **Queue Displays redesigned** per §12.1 above: both panels now show
   the full 9-parameter set, using a single-column list of rows instead of
   a table row or multi-column grid,
   fixing a real horizontal-overflow bug reproduced at 1512px width.
3. **Icons added to Call Summary Displays.** `MetricTileComponent` gained
   an optional `icon` input (a Tabler webfont class, e.g.
   `ti-phone-incoming`) — additive and backward-compatible, existing call
   sites that don't pass it are unaffected. Wired into all four Call
   Summary tiles: Incoming (`ti-phone-incoming`), Outbound
   (`ti-phone-outgoing`), Answered (`ti-phone-check`), Abandoned
   (`ti-phone-x`). Confirmed these are real Tabler icon names before using
   them. The icon webfont is loaded from a CDN in `index.html` (already
   present before this pass) — rendering the actual glyphs couldn't be
   visually verified in the sandbox this was built in, since that CDN
   domain is outside the sandbox's network allowlist (confirmed via a
   failed network request, not a code defect); the same CDN reference was
   already used successfully elsewhere in this codebase before this pass.

## 14. Changelog — queue aggregation and icon styling pass

1. **Queue Displays no longer broken down by queue name.** Both "Waiting
   Queue" and "Serving Queue" now show one aggregated set of all nine
   parameters instead of a block per queue (Sales/Support/Billing no
   longer appear on the board at all) — see §12.1 for the aggregation
   rules (sum vs. max vs. weighted-average) and why they differ per
   parameter.
2. **Call Summary icons restyled**: moved from a small glyph beside the
   label to a large (`clamp(1.75rem, 1.3rem + 1.6vw, 2.75rem)`), colorful
   icon underneath the value — `MetricTileComponent` gained an
   `iconColorVar` input (defaults to the accent token) so each of the four
   tiles gets a distinct color drawn from the existing token set, not a
   new hardcoded hex: Incoming → `--color-status-accent` (blue), Outbound
   → `--color-status-warning` (amber), Answered → `--color-status-normal`
   (green), Abandoned → `--color-status-critical` (red). Verified via
   computed style in a headless browser: 44px at 1920px width, four
   distinct colors matching the token values exactly, positioned after
   (below) the value in DOM order.

## 15. Changelog — queue stat layout: column, not grid

1. **Queue Displays changed from a 3×3 grid to a single-column list.**
   Per explicit request, the nine aggregated parameters in both "Waiting
   Queue" and "Serving Queue" now render as nine full-width rows stacked
   vertically (label on the left, value on the right, `.stat-list` in
   `queue-list.component.scss`), not a 3-column grid. This is a pure
   layout change — the aggregation math from §12.1/§14 is unaffected, and
   it further reduces horizontal-overflow risk versus the grid version
   (a single-column row has no horizontal packing to overflow at all).
   Re-verified at 1512px/HD/4K: zero horizontal overflow, zero page
   scroll.
