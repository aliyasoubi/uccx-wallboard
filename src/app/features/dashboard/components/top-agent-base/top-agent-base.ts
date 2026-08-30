import { Directive, effect, input, signal } from '@angular/core';
import { Agent } from '../../../../core/models/domain';
import {
  AgentMetricSource,
  TopAgentSnapshot,
  TopAgentTracker,
} from '../../../../core/state/top-agent-tracker';

export type CallDirection = 'inbound' | 'outbound';

/**
 * Shared tracker-wiring logic for TopInboundAgentComponent /
 * TopOutboundAgentComponent (kept as two components per CLAUDE.md; only the
 * wiring below is shared).
 *
 * `@Directive()` with no selector is required, not decorative: Angular only
 * registers a class's `input()`s for template binding
 * (`ɵɵInheritDefinitionFeature`) if that class was itself processed as a
 * Directive/Component. An undecorated base class's `input()` still creates a
 * working signal at runtime, but subclasses then fail `ng build` with
 * `NG8002: Can't bind to 'agents'` — a compile-time-only failure the unit
 * tests won't catch.
 *
 * Two signal gotchas the shape below avoids:
 *   1. The tracker must be constructed/mutated inside the effect, never a
 *      computed() — Angular forbids signal writes from computed().
 *   2. `top` must be a plain signal the effect writes into, not
 *      `computed(() => this.trackerInstance?.top() ?? null)`: the `?.`
 *      short-circuits on the first (pre-effect) read, so Angular records
 *      zero dependencies and freezes the computed at null forever.
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

// Centralized so both subclasses' title/icon/color choices stay in sync
// rather than being duplicated per file.
//
// Just the direction, not "Top Inbound Agent": these are column labels
// inside TopAgentsComponent's card, whose own title already says "Top
// Agents". Repeating "Top"/"Agent" in each column said the same thing three
// times and was the longest text in the narrowest box on the board.
export const TOP_AGENT_TITLES: Record<CallDirection, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
};

export const TOP_AGENT_ICONS: Record<CallDirection, string> = {
  inbound: 'ti-phone-incoming',
  outbound: 'ti-phone-outgoing',
};

export const TOP_AGENT_ICON_COLOR_VARS: Record<CallDirection, string> = {
  inbound: 'var(--color-status-accent)',
  outbound: 'var(--color-status-warning)',
};
