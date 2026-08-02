import { Directive, effect, input, signal } from '@angular/core';
import { Agent } from '../../../../core/models/domain';
import { AgentMetricSource, TopAgentSnapshot, TopAgentTracker } from '../../../../core/state/top-agent-tracker';

export type CallDirection = 'inbound' | 'outbound';

/**
 * Shared logic for Top Inbound Agent and Top Outbound Agent. These are two
 * separate component modules (`TopInboundAgentComponent` /
 * `TopOutboundAgentComponent`, each with its own selector, file, and spec)
 * rather than one component parameterized by a `direction` input — but the
 * tracker-wiring logic underneath is identical and non-trivial enough
 * (see the NG0600 / frozen-computed() bugs documented below) that it's
 * extracted here once instead of copy-pasted twice.
 *
 * `@Directive()` with no selector, never instantiated directly — this is
 * the standard Angular pattern for a shared abstract base class. It's
 * required, not optional decoration: Angular's compiler only registers a
 * class's `input()`/`@Input()` properties for inheritance
 * (`ɵɵInheritDefinitionFeature`) if that class has itself been processed
 * as a Directive or Component. A plain, undecorated base class's
 * `input()` still creates a working signal at runtime, but the template
 * binding system never learns it exists — every concrete component that
 * extended an earlier, undecorated version of this base failed to build
 * with `NG8002: Can't bind to 'agents' since it isn't a known property`,
 * caught by `ng build`, not by the unit tests (template type-checking
 * runs at compile time, outside Karma).
 *
 * Historical note on the two real bugs the effect/signal shape below
 * avoids reintroducing (both hit an earlier, single-component version of
 * this same logic):
 *   1. Constructing/mutating the tracker (which writes signals) must
 *      happen inside the effect, never inside a computed() — Angular
 *      forbids signal writes from a computed() unconditionally.
 *   2. `top` must be a plain signal the effect writes into, not a
 *      computed(() => this.trackerInstance?.top() ?? null): on its first
 *      evaluation (before the effect has run once), the `?.` short-circuits
 *      and the computed reads zero signals that time, so Angular treats it
 *      as constant and never recomputes it — even after the tracker is
 *      later populated. `top` would silently freeze at null forever.
 */
@Directive()
export abstract class TopAgentBase {
  protected abstract readonly direction: CallDirection;
  abstract readonly title: string;
  abstract readonly icon: string;
  abstract readonly iconColorVar: string;

  readonly agents = input<Agent[]>([]);

  private readonly _top = signal<TopAgentSnapshot | null>(null);
  readonly top = this._top.asReadonly();

  private trackerInstance: TopAgentTracker | null = null;

  constructor() {
    effect(
      () => {
        if (!this.trackerInstance) {
          this.trackerInstance = new TopAgentTracker(`top-agent-tracker:${this.direction}`);
        }
        const direction = this.direction;
        const sources: AgentMetricSource[] = this.agents().map((agent) => ({
          id: agent.id,
          name: agent.name,
          value: direction === 'inbound' ? agent.inboundCalls : agent.outboundCalls,
        }));
        this.trackerInstance.evaluate(sources);
        this._top.set(this.trackerInstance.top());
      },
      { allowSignalWrites: true },
    );
  }
}

// Re-exported so each concrete subclass can expose a static title without
// duplicating the label text — kept here so both components stay in sync
// if the label ever needs to change.
export const TOP_AGENT_TITLES: Record<CallDirection, string> = {
  inbound: 'Top Inbound Agent',
  outbound: 'Top Outbound Agent',
};

// Same rationale as TOP_AGENT_TITLES — kept here so both components' icon
// choices stay in sync rather than duplicating the Tabler class per file.
export const TOP_AGENT_ICONS: Record<CallDirection, string> = {
  inbound: 'ti-phone-incoming',
  outbound: 'ti-phone-outgoing',
};

export const TOP_AGENT_ICON_COLOR_VARS: Record<CallDirection, string> = {
  inbound: 'var(--color-status-accent)',
  outbound: 'var(--color-status-warning)',
};
