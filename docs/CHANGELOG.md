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

## Pass 9 — Queue Displays: per-queue panels, dropping cross-queue aggregation

External contributor commit (`fix: QueueListComponent`) replaced the
aggregated Waiting/Serving Queue design from Pass 3–4 with one panel
per queue, aligned against the real production API rather than the
fixture-driven aggregated view.

1. **`QueueListComponent` now takes a single `queue` input** (`Queue |
   undefined`) instead of `queues: Queue[]` plus a `variant: 'waiting' |
   'serving'` discriminator. All nine stats (Inbound, Handled, In Queue,
   Abandons, CWD, MAD, ACT, Ready Agents, SLA) are read directly off
   that one queue — the sum/max/weighted-average aggregation math from
   Pass 3 is gone. `DashboardComponent` now `@for`-loops
   `store.queues()` and renders one `app-queue-list` per queue
   (Sales/Support/Billing), so the per-queue breakdown that Pass 3
   deliberately removed is back, with each panel titled by `queue.name`.
2. **Fixed alongside:** `hasData` was implemented as `this.queue !==
   undefined`, comparing the input *signal function* itself rather than
   calling it — that reference is never `undefined`, so the "No data"
   empty state was unreachable even with no queue set. Changed to
   `this.queue() !== undefined`; `queue-list.component.spec.ts` updated
   to assert the fixed behavior (the "No data" state now actually
   renders when no queue is set) instead of documenting the bug as
   current behavior.
3. `docs/ARCHITECTURE.md` §1/§9/§10 and `CLAUDE.md`'s queue-aggregation
   rules updated to describe the current per-queue behavior instead of
   the removed cross-queue aggregation.

**Flagged, not addressed in this pass:**
- `dashboard.component.html` passes `variant="waiting"` to every
  `app-queue-list` instance, but `QueueListComponent` no longer declares
  a `variant` input — the attribute is now inert, and the old "Serving
  Queue" panel has no replacement. Needs a decision from the
  contributor/product owner on whether that's intentional.
- Whether dropping cross-queue aggregation entirely (vs. the per-queue
  Pass 3 behavior) is an intentional product decision or an in-progress
  refactor — this pass treated the contributor's commit as source of
  truth and did not change that behavior, only fixed the `hasData` bug
  and brought docs in line with it.

Verified with `npm run test:ci` (131/131 passing).

## Pass 10 — Visual hierarchy: group cards, tile-level severity, gauge scale

Design pass driven by a reference wallboard mock-up: the board's weak
point was hierarchy — every band carried equal visual weight, and the
two numbers a wallboard exists for (SLA, and any metric in a bad state)
didn't dominate from across a room.

1. **Calls Summary and KPI Metrics got the standard panel card.** They
   were the only two bands whose tiles floated directly on the page
   background with no grouping container. Each now wraps its tile grid
   in a `.group-card` (surface-1 + border + `--shadow-panel`, same
   chrome as every other panel) with an accent-underlined uppercase
   section label ("Calls Summary" / "KPI Metrics").
2. **`MetricTileComponent` re-tuned for life inside a card.** Default
   tile background moved surface-1 → surface-2 (one elevation step above
   its new parent card, so cells read as cells) and the tile's own
   `box-shadow` was dropped — a shadow nested inside a shadowed card
   reads as mud, so the card carries elevation and the tile border
   carries separation.
3. **Severity now escalates the whole tile, not just the number.**
   New `tile--warning` / `tile--critical` classes tint the tile border;
   critical additionally pulses a soft glow (`tile-glow` keyframes on
   `--motion-pulse`, so `prefers-reduced-motion` zeroes it like every
   other animation). Spec added asserting the class toggling.
4. **SLA/CSAT rings scale with the viewport.** `MeterComponent`'s cap
   went from a fixed 120px to `clamp(140px, 12vw, 240px)` (same clamp()
   idiom as the typography tokens), and the center value stepped up
   from heading- to metric-size type. Width-driven, not height-driven,
   so the ring keeps a content height in the stacked <1000px layout.
5. **Agent Summary's online count became a title-row pill** (dot +
   "N agents online" chip, surface-2 on a 999px radius) instead of a
   muted footer line — a live headcount is a status, and statuses on
   this board read as chips.

**Flagged, not addressed:** Queue Displays renders "NaN:NaN" for Max WD
under mock fixtures — pre-existing, likely a fixture/mapper field
mismatch on the provisional `QueueTimingStatsDto` shape (see CLAUDE.md
known-provisional fields). Not touched in this pass.

Verified with `npm run test:ci` (133/133 passing) and a fixture-driven
Chrome render (`useMockFixtures` temporarily true, restored to false):
group cards, tile severity border/glow (animation confirmed running at
0.9s), enlarged gauges, and the online-count pill all render as
described at 1920x1080.

## Pass 11 — Queue Displays: one guarded duration formatter, no NaN on the board

Follow-up to the "Max WD NaN:NaN" report. The reported symptom was already
gone by the time this pass ran — the DTO update (`fix: update dtos`) moved
`maxWaitDuration`/`avgHandleDuration` out of `CsqDto.timings` and into
`CsqDto.callStats`, where the fixture supplies them, so Max WD renders real
values again. What remained was the reason a missing field became `NaN:NaN`
rather than a graceful placeholder.

1. **`QueueListComponent` no longer carries its own duration formatter.** It
   had a private `formatDuration()` that was a line-for-line copy of
   `FormatDurationPipe` *minus* the pipe's `null`/`NaN` guard, so any absent
   backend field ran through `Math.floor(NaN)` and reached the wallboard as
   `NaN:NaN`. The formatting logic is now a single exported
   `formatDurationSeconds()` in `format-duration.pipe.ts`; the pipe delegates
   to it and the component calls it directly, so the guard can't be dropped
   in a copy again. Missing durations render `--:--`.
2. **Handled % no longer divides by zero.** `100 * handled / total` produced
   `NaN` for a queue with no calls (start of day, or an idle CSQ), rendering
   `0 (NaN%)`. It now shows `0 (--%)`.
3. **Specs unblocked.** `npm run test:ci` had stopped compiling entirely
   after the DTO change — `queue.mapper.spec.ts` and
   `call-summary.mapper.spec.ts` still built the old DTO shapes, so Karma
   aborted with a load error and **zero tests ran** while `ng build` kept
   passing and hid it. Both fixtures updated to the current contract; the
   "maps the timings block to CWD/MAD/ACT" test became "maps CWD from timings
   and MWD/ACT from callStats" to match where those fields now live.
4. **New coverage:** `format-duration.pipe.spec.ts` (the shared formatter had
   no spec at all), plus two `QueueListComponent` regression tests that assert
   the board never renders the string "NaN" for missing durations or an idle
   queue.

**Provisional — unchanged by this pass.** CWD/MWD/ACT still have unconfirmed
meanings (see `CLAUDE.md` known-provisional fields and the `Queue` domain
model), and MWD/ACT being sourced from `callStats` instead of `timings` is
itself an unratified remap. This pass only stopped bad values from rendering
as `NaN`; it deliberately does not bless either the field semantics or the
re-sourcing. Comments at both call sites say so.

Verified with `npm run test:ci` (141/141 passing, up from 0 executing) and a
live fixture-backed render: with `maxWaitDuration`/`avgHandleDuration`
deleted from the Sales fixture and `totalCalls` forced to 0, the panel shows
`Max WD --:--`, `AVG Talk Time --:--`, `Handled 0 (--%)` and no "NaN"
anywhere on the board; with the fixture restored, real values return
(`Max WD 1:01` / `2:20`).

## Pass 12 — Fixing the Pass 10 layout regression, plus review follow-ups

Pass 10 was verified only at 1920x1080 and shipped a regression that a
review at 1366x768 caught: the flexible bands in column 1 had collapsed to
22px, clipping the SLA/CSAT gauges and both Top Agent panels to a sliver.
This pass fixes that and the rest of the review findings.

**The layout regression, in three parts:**

1. **Calls Summary was claiming 406px of a 659px column.** Its tile grid used
   `minmax(110px, 1fr)`, wider than a quarter of the 450px column, so four
   tiles wrapped onto two rows. Dropped to `minmax(72px, 1fr)` — one row,
   225px. The group-card padding also went from `--space-4` to `--space-3`,
   since every pixel in a `flex: 0 0 auto` band is taken permanently from the
   flexible bands below it.
2. **The gauge ring was sized from the wrong axis.** `max-width` + square
   `aspect-ratio` let its *height* track viewport *width*, demanding 167px in
   a band that had far less. It is now sized from height —
   `height: min(100%, clamp(140px, 12vw, 240px))` — so it shrinks to fit the
   scarce axis. Two traps found while doing this, both documented in the SCSS:
   an explicit `width` beats `aspect-ratio` (capping height alone just
   squashed the ring into an ellipse), and `container-type: size` collapses
   the element to 0x0 (only `inline-size` is wanted). Ring text now scales in
   `cqw` so it stays inside a shrunken ring, and the <1000px stacked layout
   gets width-driven sizing since percentage heights are indefinite there.
3. **Top Agent panels overflowed by 15px** because "Top Inbound Agent" wrapped
   to two lines at `--font-size-heading`. The title is now `--font-size-label`,
   matching Agent of the Month's eyebrow.

Measured after: **zero clipped elements at 1280x720, 1366x768, 1920x1080 and
2560x1440**, and the <1000px stacked layout still scrolls as intended.

**Other review findings fixed:**

4. **Metric tiles had an invisible border.** Pass 10 set their background to
   `--color-surface-2`, which is the same hex as `--color-border` — so the
   border vanished, and Pass 10 had also removed their box-shadow. Added
   `--color-border-elevated` for anything sitting on surface-2.
5. **`mapOutboundCallDirectionStats` leaked a sentinel.** It hardcoded
   `topAgentCalls: 0` and returned `Number.MAX_SAFE_INTEGER` as
   `lowestAgentCalls`, reintroducing the exact bug an existing test forbids
   for the inbound mapper. It now delegates to `mapCallDirectionStats` for
   the per-agent high/low and takes only the total from the outbound endpoint.
6. **`.toFixed()` crash paths guarded.** `SlaGaugeComponent.hasData` checked
   only that the metrics object was non-null, so a payload with `sla: null`
   threw and took the panel down. Both it and the CSQ SLA row now require a
   finite number; `MeterComponent.ratio` guards non-finite values that would
   otherwise reach `stroke-dasharray` as `NaN NaN`.
7. **CSAT no longer fabricates a reading.** It rendered
   `(csatScore ?? 0).toFixed(1)` in normal accent color, showing "0.0" for a
   missing score — indistinguishable from a genuine catastrophic CSAT. It now
   mirrors the SLA gauge's em-dash-and-muted treatment. First spec file for
   this component.
8. **Group-card SCSS deduplicated** into `shared/styles/_panels.scss` (the
   first shared SCSS partial in the repo — components previously shared only
   CSS custom properties), and the stray `CsqStats copy.json` fixture, which
   was being copied into the production bundle, is deleted.

**Still open, deliberately not decided here:** `queue.mapper` feeds
`avgTalkSeconds` from `avgHandleDuration` while `call-summary.mapper` feeds
the same domain field from `avgTalkDuration`, and the Queue Displays row is
labelled "AVG Talk Time". Reconciling that changes what the number *means*,
which needs the backend team — see the provisional-fields note in CLAUDE.md.

Verified with `npm run test:ci` (149/149 passing) and a production build.
