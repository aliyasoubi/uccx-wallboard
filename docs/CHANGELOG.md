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

## Pass 5 — UI audit: correctness bug fixes

Full-project UI review; these four were confirmed as bugs (misleading
or missing rendered output, not style/a11y polish) and fixed. A11y and
best-practice findings from the same audit were logged but intentionally
left unfixed this pass, per request.

1. **SLA Gauge and KPI FCR tile no longer show a false "all clear" on
   load.** Both previously defaulted severity to "100%/best-case" when
   `metrics`/`serviceMetrics` was `null`, while the *displayed* value
   defaulted to `0`. Net effect: on every fresh page load, and for the
   duration of any real backend outage, the SLA ring showed a green
   `0%` and the FCR tile an uncolored `0%` — both looking like readings,
   not like "no data yet". `SlaGaugeComponent` and `KpiMetricsComponent`
   now gate severity behind an explicit `hasData()`/`hasFcrData()` check
   and render `—` instead of a fabricated `0`/`0%` until real data
   arrives, matching the empty-state convention already used by Call
   Summary Displays and Queue Displays.
2. **KPI Metrics' "Calls in queue" tile restored.** It was commented
   out in the template while still being computed
   (`callsWaitingSeverity`) and still documented in this component's own
   header comment and covered by its spec (`kpi-metrics.component.spec.ts`
   asserts the text `'Calls in queue'` is present) — the spec should
   have been failing. Uncommented; no logic changes.
3. **AgentStateDonutComponent now renders the center total it already
   computes.** `total` (the literal sum of ready + talking + notReady)
   was computed and covered by a dedicated spec assertion, but the
   template never placed it in the ring — the donut rendered with an
   empty hollow center. Added a `.ring-total` element, absolutely
   positioned over the (now wrapped) SVG ring.
4. **Queue Displays: warning and critical severities are visually
   distinct again.** `.stat-value--warn` applied to any
   non-normal severity and was hardcoded to the critical/red token, so
   a merely-elevated stat (e.g. abandon ratio past its warning floor but
   not its critical one) looked identical to an actually-critical one.
   Split into `.stat-value--warning` (amber) and `.stat-value--critical`
   (red), matching the three-tier severity treatment already used
   correctly by `MetricTileComponent` elsewhere on the board.

## Pass 6 — Column 2 height rebalance (Queue Displays vs. Agent State/Agent of the Month)

Reported with a screenshot: Waiting/Serving Queue titles visually
overlapping "Inbound" (the first stat row), and Agent State/Agent of the
Month sitting in a much taller box than their content needs.

1. **Root cause.** `queue-list.component.scss`'s `.stat-list` centered
   its nine rows (`justify-content: center`) inside a panel with
   `overflow: hidden`. Once the panel is shorter than the nine rows need,
   centering overflows symmetrically — up and down — so the excess
   painted over `.title` above it. The prior pass's 2:1 height ratio
   between `.band--queues` and `.band--agent-highlights` reduced this but
   didn't eliminate it at shorter viewport heights, since Agent State/
   Agent of the Month were still being stretched well past their content
   needs on the other side of that ratio.
2. **`dashboard.component.scss`: `.band--queues`/`.band--agent-highlights`
   changed from a fixed 2:1 flex ratio to content-sized.** Agent State/
   Agent of the Month now use `flex: 0 0 auto` (grow only to their own
   content, the same pattern already used for `.band--summary`/
   `.band--kpi` in column 1) and Queue Displays takes `flex: 1 1 auto` —
   every remaining pixel in the column. Driven by actual content height
   rather than a ratio, so it stays correct across HD-4K instead of
   needing another guessed ratio if content changes again.
3. **`queue-list.component.scss`: `.stat-list` changed from
   `justify-content: center` to `justify-content: space-between`.**
   Still fills the available height evenly when there's room, but any
   remaining overflow is now downward-only (clipped by `overflow: hidden`
   on `.queue-list`) and can never bleed upward into the title again,
   regardless of how tight the panel's height ever gets.
4. **Minor cleanup while in these components:** `agent-of-month`'s
   hardcoded `2px` name margin replaced with `var(--space-1)` (project
   convention is to never hardcode spacing); added `min-width: 0` +
   text-overflow ellipsis so a long agent name truncates instead of
   overflowing the card now that the panel is compact; added the
   `:host { display: block; }` rule to `AgentStateDonutComponent` that
   every other component already has (previously relying on its parent's
   flex context to auto-blockify it, which happened to work but was
   inconsistent with the rest of the app).

Verified with `npm run test:ci` (128/128 passing, including the
previously-failing "Calls in queue" assertion from Pass 5) and a
production build rendered in real Chrome at 1360×900 and 1920×1080.

## Pass 7 — Agent Summary: column headers, Calls column, status-tinted avatars, reason-aware badges

Requested improvements after comparing the panel against a reference
design. Adopted the ideas that held up for a wallboard viewed from a
few feet away for hours at a stretch; explicitly did not adopt a couple
that didn't (see rationale below).

1. **New `shared/status-visuals.ts`.** Single source of truth for each
   status's label/color/background, previously a private const inside
   `StatusBadgeComponent`. Now also consumed by `AgentSummaryComponent`
   for avatar tinting, so the badge and the avatar can never drift out
   of sync with each other. Fixed the Not Ready color pairing while
   here: `--color-status-neutral` on `--color-surface-2` measured
   3.19:1 contrast (fails WCAG AA's 4.5:1 floor for normal text);
   swapped to `--color-text-secondary` on the same background, ~6.4:1.
2. **`StatusBadgeComponent` gained an optional `reason` input.** When
   status is Not Ready and a reason string is present, it's shown in
   place of the generic "Not ready" label (e.g. "Break", "Meeting") —
   color/background stay tied to the actual status regardless, so an
   unrecognized reason string never invents an unbacked color. The data
   was already flowing (`Agent.reason`, sourced from
   `AgentDto.state.reason`) but no component displayed it before this.
   Added `status-badge.component.spec.ts` (previously had no test file)
   covering the default per-status label and this override behavior.
3. **Agent Summary: added a header row** ("Agent / State / Duration /
   Calls") and a **Calls column** (`Agent.inboundCalls +
   Agent.outboundCalls`, already in the domain model, just never
   displayed). Header and data rows share one `--roster-columns` custom
   property so the two can't drift out of alignment independently.
4. **Avatars: two-letter initials, status-tinted, larger (28px → 36px).**
   "John Smith" and "Jane Sato" no longer collapse to the same "J".
   Background/foreground reuse the same status-visual mapping as the
   badge, so an agent's row tells the same story twice (redundant
   encoding, not competing colors).
5. **Row/column overflow safety.** `minmax(0, Nfr)` columns (not plain
   `Nfr`) plus `min-width: 0` + ellipsis on `.name` — the same overflow
   trap fixed for `agent-of-month`/`top-agent-base` in Pass 6, applied
   here too; a long agent name now truncates instead of ever being able
   to push the row wider than the panel.
6. **Deliberately not adopted from the reference design:** outlined/
   ghost badge chips (a filled pill reads faster at wallboard viewing
   distance than a 1px border + colored text), fully saturated
   per-agent avatar colors unrelated to status (reserving color for
   status keeps it meaningful instead of decorative), and an unlabeled
   status dot next to the online count (the board already has a
   connection-status indicator in the global footer; a second
   similar-looking dot risked being read as the same thing).

Verified two ways: `npm run test:ci` (133/133 passing, incl. 5 new),
and a real Chrome render (dev build, so mock fixtures are live) with
Playwright — confirmed pixel-exact header/row column alignment, exact
expected avatar background/foreground colors per status
(`rgba(79,209,165,.12)`/`rgb(79,209,165)` for Ready, etc.), correct
reason-override text ("Break"/"Meeting") for the two Not Ready agents
in the fixture data, correct Calls totals (26/34/21/36/16), and no
horizontal overflow on any row.

## Pass 8 — Agent Summary row-height cap; KPI Metrics "Calls in queue" hidden

Two follow-ups after seeing Pass 7 actually rendered.

1. **Agent Summary rows no longer stretch to fill the whole panel.**
   With a small roster (e.g. the 5-agent fixture), `.row`'s
   `flex: 1 1 0` was dividing the *entire* panel height evenly across
   however many agents there were — 5 agents in a ~950px-tall column
   meant ~190px per row, most of it dead space around a 36px avatar.
   Added `max-height: 3.75rem` (60px) as a clamp: rows still grow to
   fill available space and still shrink below the cap when a large
   roster genuinely needs it (same flex-shrink/min-height:0 mechanism
   as before — the "never scrolls, whatever the roster size" guarantee
   is unchanged), but growth now stops at a comfortable, compact size
   instead of continuing to inflate every row. Any leftover space with
   a small roster now sits empty below the last row rather than being
   distributed into taller rows. Confirmed via Playwright: all 5 rows
   render at exactly 60px regardless of the 834px available to `.list`.
2. **KPI Metrics: "Calls in queue" hidden again — deliberately, this
   time.** Not needed for now, per explicit request. Re-commented the
   tile in the template, but unlike the Pass 5 case (an accidental
   regression — dead code contradicting the component's own doc comment
   and its own spec), this one is clearly dated and explained in the
   component's header comment so a future pass doesn't mistake it for
   the same bug and "fix" it back on. `callsWaitingSeverity` is left
   computed (unused but harmless) so re-enabling is a one-line template
   change. Updated `kpi-metrics.component.spec.ts` to match: removed
   the assertion expecting the tile's text, and added an explicit
   guard test (`does not render Calls in queue while it is deliberately
   hidden`) so the suite documents the current intended state rather
   than just going quiet about it.

Verified with `npm run test:ci` (134/134 passing) and a real Chrome
render confirming both changes objectively: `app-kpi-metrics` text
content no longer includes "Calls in queue", and every Agent Summary
row measures exactly 60px tall.
