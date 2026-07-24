# Changelog

History of implementation passes on this dashboard. Current architecture
lives in `docs/ARCHITECTURE.md` — this file is the "what changed and
when," kept separate so the architecture doc stays a clean current-state
reference instead of accumulating history inline.

## Pass 1 — Module mapping & runtime config

Migrated from an earlier React/Vite implementation to this Angular 18
app. All prior metrics preserved or extended.

1. **Queue Displays extended.** Added CWD/MAD/ACT/SLA to `Queue`,
   `CsqDto` gained a `timings` sub-object (`QueueTimingStatsDto`) and its
   already-declared-but-unused `serviceMetrics` field is now actually
   mapped. `CsqStats.json` rewritten to match.
2. **Call Summary Displays refocused** to exactly
   Abandoned/Incoming/Outbound/Answered. The previous panel's AWD (avg
   wait) and AHT (avg talk) tiles were relocated — not dropped — to the
   new KPI Metrics module.
3. **FCR added** as a new KPI, mocked pending a real backend field (see
   `docs/ARCHITECTURE.md` §11).
4. **Agent Summary — "only first item works" investigated, not
   reproduced.** Reviewed the `@for`/`track` expression, OnPush setup,
   and the full mapper pipeline; every fixture agent rendered correctly.
   Hardened anyway (simplified `track` to a plain `agent.id` expression,
   guarded a blank name) and added a dedicated regression test
   (`agent-summary.component.spec.ts`) asserting all rows render, not
   just the first.
5. **`Agent.inboundCalls` / `Agent.outboundCalls` now mapped** — the
   underlying data already existed on the wire but the old mapper
   dropped it; needed to power Top Inbound/Outbound Agent.
6. **Top Inbound Agent / Top Outbound Agent implemented** with genuine
   dynamic-max tracking (only rises, never falls on a quiet poll tick)
   and a 24-hour reset window. See `core/state/top-agent-tracker.ts` and
   the two signal bugs below.
7. **Runtime config actually wired up.** Before this pass,
   `assets/config.json` existed but had no effect — `app.config.ts` now
   registers the `APP_INITIALIZER` that loads it.
8. **Test infrastructure added.** `angular.json` had no `test` target at
   all; added it, plus `karma.conf.js` and `tsconfig.spec.json`, and the
   initial spec suite.
9. **`.gitignore` added** — was missing (`node_modules`, `dist`,
   `coverage`, `.angular/cache` were previously untracked-ignore-less).

**Two real signal bugs caught by running the suite, not just
type-checking** — now documented as gotchas in
`docs/ARCHITECTURE.md` §6.1:
- `TopAgentBase` initially threw `NG0600` (writing to a signal from
  inside a `computed()`), from constructing the tracker lazily inside a
  `computed()` read.
- After fixing that, the `top` value froze at `null` forever: a
  `computed(() => this.trackerInstance?.top() ?? null)` short-circuits
  via `?.` on its *first* evaluation, so it records zero reactive
  dependencies that time — Angular then treats it as constant and never
  recomputes it. Fixed by having the effect write into a plain owned
  `signal()` instead.

## Pass 2 — UI refinement

1. **"Resets every 24h" caption removed** from the Top Inbound/Outbound
   Agent cards. The underlying 24-hour reset logic in `TopAgentTracker`
   is unchanged — this only removed the on-screen caption.
2. **Queue Displays redesigned**: both panels now show the full
   9-parameter set as a single-column list instead of a table row or
   grid, fixing a horizontal-overflow bug reproduced at 1512px width.
3. **Icons added to Call Summary Displays.** `MetricTileComponent`
   gained an optional `icon` input (a Tabler webfont class, e.g.
   `ti-phone-incoming`), wired into all four tiles: Incoming
   (`ti-phone-incoming`), Outbound (`ti-phone-outgoing`), Answered
   (`ti-phone-check`), Abandoned (`ti-phone-x`). The icon webfont is
   loaded from a CDN in `index.html`.

## Pass 3 — Queue aggregation and icon styling

1. **Queue Displays no longer broken down by queue name.** Both
   "Waiting Queue" and "Serving Queue" now show one aggregated set of
   all nine parameters instead of a block per queue (Sales/Support/
   Billing no longer appear on the board directly) — see
   `docs/ARCHITECTURE.md` §10 for the sum/max/weighted-average rules.
2. **Call Summary icons restyled**: moved from a small glyph beside the
   label to a large (`clamp(1.75rem, 1.3rem + 1.6vw, 2.75rem)`),
   colorful icon underneath the value. `MetricTileComponent` gained an
   `iconColorVar` input so each tile gets a distinct color drawn from
   the existing token set: Incoming → `--color-status-accent` (blue),
   Outbound → `--color-status-warning` (amber), Answered →
   `--color-status-normal` (green), Abandoned →
   `--color-status-critical` (red).

## Pass 4 — Queue stat layout: column, not grid

1. **Queue Displays changed from a 3×3 grid to a single-column list.**
   The nine aggregated parameters in both "Waiting Queue" and "Serving
   Queue" now render as nine full-width rows stacked vertically
   (`.stat-list` in `queue-list.component.scss`), not a 3-column grid —
   a pure layout change, aggregation math unaffected. Reduces
   horizontal-overflow risk further versus the grid version.
