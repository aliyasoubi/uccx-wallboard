# Call Center Dashboard — Target Architecture & Standards

This document defines the target architecture for the CCCX call center wallboard refactor. It replaces the current React/Vite implementation with an Angular app built for long-term maintainability by a rotating team. All existing metrics (calls summary, agent states, SLA/CSAT, per-queue breakdown, agent roster, agent of the month) are preserved — this changes *how* the code is structured and styled, not what it reports.

## 1. Tech stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Angular 18+, standalone components, no NgModules | Current Angular default; less ceremony for new joiners |
| Language | TypeScript, `strict: true`, no implicit `any` | Prevents the DTO/contract drift found in the current codebase |
| State | Angular Signals in injectable services (no NgRx) | Dashboard state is a handful of live resources, not complex cross-feature state — signals keep it simple and debuggable |
| Live data | Polling now, behind a swappable interface — see §4 | Keeps today's solution simple while making the WebSocket upgrade a contained, later change |
| Backend | BFF (Backend-for-Frontend) layer — see §3 | Frontend should never talk directly to the raw telephony/reporting system |
| Styling | SCSS + CSS custom properties as design tokens, written as logical properties | Single palette/type-scale source of truth; RTL-ready from day one — see §8 |
| Charts | ECharts via a thin Angular wrapper | Canvas-based, smooth live-updating transitions, good animation support for gauges/meters |
| Animations | Angular Animations API + CSS transitions | Native, DI-friendly, testable, respects `prefers-reduced-motion` — see §6 |
| i18n | Transloco | Runtime language switching without a rebuild — see §8 |
| Icons | Inline SVG icon set (e.g. Tabler icons), not emoji | Accessible, recolorable via CSS, consistent across OS/browsers |
| Testing | Jasmine/Karma + Angular Testing Library + MSW + Playwright | See §7 for the mock-first strategy |
| Tooling | Angular CLI (esbuild), ESLint (`angular-eslint`), Prettier | Standard, low-maintenance, enforced in CI |
| Config | Angular `environment.ts` per target (dev/staging/prod) | No hardcoded API URLs in source |

## 2. Folder structure

```
src/app/
├── core/
│   ├── data-access/
│   │   ├── data-source.token.ts         # DataSource interface (see §4)
│   │   ├── polling-data-source.ts       # today's implementation
│   │   └── websocket-data-source.ts     # added in a later phase, same interface
│   ├── models/
│   │   ├── dto/                         # raw shapes exactly as the BFF returns them
│   │   └── domain/                      # clean, UI-facing models
│   ├── mappers/                         # DTO -> domain, one per resource, unit-tested
│   ├── policies/
│   │   └── status-thresholds.policy.ts  # single source of truth for severity rules
│   └── state/
│       └── dashboard-store.service.ts   # signal-based store, owns the current snapshot
├── shared/
│   ├── components/                      # presentational, reusable, no HTTP knowledge
│   │   ├── metric-tile/
│   │   ├── status-badge/
│   │   ├── meter/
│   │   └── agent-avatar/
│   ├── pipes/
│   │   └── format-duration.pipe.ts
│   └── styles/
│       ├── _tokens.scss                 # colors, spacing, radii as CSS custom properties
│       └── _typography.scss             # fluid type scale with clamp(), not vw
├── i18n/
│   └── assets/i18n/{en,fa}.json
└── features/
    └── dashboard/
        ├── dashboard.component.ts       # shell/container — reads the store, no HTTP calls
        └── components/
            ├── calls-summary-panel/
            ├── queue-panel/
            ├── agent-roster/
            ├── service-metrics-panel/
            └── agent-of-month-card/
```

## 3. Backend — BFF, not direct-to-source

The frontend should not call the raw telephony/reporting endpoints (`/csqssummary`, `/agents`, `/currentCalls`, `/callsInInterval`) directly. Instead, a small **Backend-for-Frontend** service sits in between:

```
Angular Dashboard  →  BFF (Node/NestJS)  →  Telephony / reporting system (UCCX, Finesse, etc.)
```

What the BFF owns:
- **Normalization** — one clean, versioned contract for the dashboard, regardless of what the source system's field names look like or how often they change.
- **Aggregation** — combines the four source calls into fewer, purpose-built responses so the frontend isn't orchestrating multiple requests.
- **The polling itself** — the BFF polls the source system, not the browser. This is what makes the later WebSocket upgrade possible: many dashboard clients can connect to one BFF, which polls the source once and fans updates out to everyone, instead of N browsers each polling independently.
- **A stable place to fix the current contract drift** — field name mismatches (like the ones found between the old mapper and the uploaded JSON files) get corrected once, at the source, instead of being worked around in frontend mappers.

If a BFF isn't feasible immediately, the mapper-layer approach (DTO → domain model, §2) is the fallback — but ownership of data-shape correctness should move to the backend as soon as it's practical.

## 4. Data layer — DataSource abstraction (polling now, WebSocket later)

The store never talks to HTTP or WebSocket directly — it depends on a `DataSource` interface:

```typescript
// core/data-access/data-source.token.ts
export interface DataSource {
  readonly updates$: Observable<DashboardSnapshot>;
  readonly connectionState$: Observable<'live' | 'stale' | 'error'>;
}
export const DATA_SOURCE = new InjectionToken<DataSource>('DATA_SOURCE');
```

**Phase 1 (now) — polling:**

```typescript
// core/data-access/polling-data-source.ts
@Injectable()
export class PollingDataSource implements DataSource {
  updates$ = interval(POLL_INTERVAL_MS).pipe(
    startWith(0),
    switchMap(() => this.bffClient.fetchSnapshot()),
    retry({ delay: exponentialBackoff }),
    catchError(() => { this.state.set('error'); return EMPTY; }),
  );
}
```

**Phase 2 (later) — WebSocket, same interface:**

```typescript
// core/data-access/websocket-data-source.ts
@Injectable()
export class WebSocketDataSource implements DataSource {
  updates$ = webSocket<DashboardSnapshot>(BFF_WS_URL).pipe(
    retryWhen(errors => errors.pipe(delay(RECONNECT_DELAY_MS))),
  );
}
```

Swapping phases is a one-line change in the app config (`{ provide: DATA_SOURCE, useClass: PollingDataSource }` → `useClass: WebSocketDataSource`) — nothing in the store, mappers, or components changes. Recommend keeping polling as an automatic fallback if the socket disconnects, so the board degrades gracefully instead of going silent.

The store also tracks its own health (`connectionState`), fixing the current app's biggest gap: today, if the API becomes unreachable, the board silently keeps showing stale zeros with no indication anything is wrong.

## 5. Status/severity — one policy, not five inline conditionals

Every threshold currently duplicated across components (`0.1`, `30`, `60`, `120`, `180`, `0.3`) moves to one config object:

```typescript
// core/policies/status-thresholds.policy.ts
export const STATUS_THRESHOLDS = {
  abandonedRatio:  { warning: 0.05, critical: 0.10 },
  avgWaitSeconds:  { warning: 30,   critical: 60 },
  avgTalkSeconds:  { warning: 120,  critical: 180 },
  callsInQueue:    { warning: 3,    critical: 6 },
  notReadyRatio:   { warning: 0.30, critical: 0.50 },
} as const;

export function getSeverity(value: number, thresholds: { warning: number; critical: number }): Severity {
  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.warning) return 'warning';
  return 'normal';
}
```

Changing a business rule means editing one constant, not hunting through JSX/templates across multiple components.

## 6. Component design & animation

- **Shared primitives first**: `metric-tile`, `status-badge`, `meter` are built and reviewed in isolation (Storybook or Angular's dev harness) before being wired into the dashboard — this directly fixes the "seven CSS files, no shared palette" problem in the current app.
- **Angular Animations API** for anything tied to state change: count-up transitions on KPI value changes, a crossfade when an agent's status badge changes, a single brief pulse (not a loop) when a metric crosses into `warning`/`critical`. All respect `prefers-reduced-motion`.
- Deliberately restrained motion — this is a wallboard people look at for hours, not a marketing page. GSAP-level animation sequencing isn't needed here; Angular Animations covers everything above without an extra dependency.
- Design tokens use fluid sizing via `clamp()` rather than raw `vw`/`vh`, fixing the current inconsistency where the board renders differently depending on monitor aspect ratio.

## 7. Testing — mock first, real environment second

1. **Static fixtures** — the six JSON files already shared become checked-in fixtures (`testing/fixtures/*.json`). Early component and store work happens entirely against these, no network involved.
2. **Mock Service Worker (MSW)** — intercepts HTTP at the network level and serves the fixtures, including simulated polling ticks, so live-update behavior can be developed and demoed without a real backend. Same mocks work in unit tests, Storybook, and local dev.
3. **Unit tests** — every mapper and every `getSeverity()` call is tested against fixtures. This is the exact layer where the current app's real bug (contract drift) lives, so it's the layer that most needs regression protection.
4. **Contract check against the real/BFF API** — once a dev or staging BFF endpoint exists, a smoke-test suite asserts the live response still matches what the DTOs expect, catching drift before it reaches production.
5. **E2E** — Playwright, run against staging with the real BFF, covering the dashboard end-to-end.
6. **Cutover** — swap environment config from mock/staging to production; nothing else changes, since environment is just configuration behind the `DataSource` abstraction.

## 8. Multi-language (Farsi + English, RTL)

- **Library**: Transloco, not `@angular/localize` — the built-in tool requires a separate build per locale, which is awkward for a dashboard where an operator should be able to switch language from a dropdown without a redeploy. Transloco supports runtime switching. Translation files: `assets/i18n/en.json`, `assets/i18n/fa.json`, keyed by component/feature.
- **RTL layout**: Farsi is RTL, which is a layout concern, not just a string-translation one. All shared component styles use CSS logical properties from the start (`margin-inline-start` instead of `margin-left`, `padding-inline-end` instead of `padding-right`), with `dir="rtl"` toggled on `<html>` based on the active locale. This is baked into the design-token work in §2/§6 now, since retrofitting RTL after components are built with physical `left`/`right` properties is expensive.
- Status meaning (severity colors, icons) stays language-agnostic — labels translate, the color/icon system does not need a separate RTL variant.

## 9. Project phases

1. **Discovery** — confirm the real BFF/API contract against the mismatches found in the code review (see the two open items below), confirm the full queue list, confirm language requirements.
2. **Design tokens & component inventory** — palette, type scale (with `clamp()`), logical-property RTL support, and the shared primitives (`metric-tile`, `status-badge`, `meter`) built and reviewed in isolation before any data is wired in.
3. **Data layer** — DTOs, mappers, the `DataSource` interface with `PollingDataSource`, and the signal store, built and tested entirely against MSW-served fixtures.
4. **Feature assembly** — the dashboard shell composed from the shared components plus the store, i18n wired in.
5. **Animation & polish pass** — deliberately last, once layout is stable, so motion isn't fighting a moving target.
6. **Testing & accessibility pass** — mapper/policy unit tests, contract check against a real BFF endpoint, a11y check that no status is color-only.
7. **Staged rollout** — dev → staging (real BFF) → production, ideally run alongside the existing dashboard for a burn-in period before full cutover.
8. **Later phase** — swap `PollingDataSource` for `WebSocketDataSource` once the BFF supports push; no frontend rework required beyond that provider swap.

## 10. Open items before implementation starts

- **Confirm the real contract.** The six JSON files shared don't match the current app's mapper at all (different field names, and the queue data is nested `agentStateStats: {...}` here vs. flat fields in the old code) — need to know whether these files represent the current live API, a planned BFF contract, or something else, so the DTOs are written against the right shape.
- **Confirm the full CSQ/queue list** (`Sales`, `Support`, `Billing`, plus any others) so the queue panel isn't built assuming a fixed count of three.
- **Confirm the `agentOfMonth.photoUrl` fallback** — it's currently an empty string in the sample data, so the avatar component needs a defined fallback (e.g. initials) rather than a broken image.

---

Once the open items are confirmed, implementation starts at Phase 2 (design tokens & component inventory) in §9.
