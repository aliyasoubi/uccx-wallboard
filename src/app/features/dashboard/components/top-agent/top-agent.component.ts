import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { Agent } from '../../../../core/models/domain';
import { AgentMetricSource, TopAgentSnapshot, TopAgentTracker } from '../../../../core/state/top-agent-tracker';

export type CallDirection = 'inbound' | 'outbound';

// Backs both "Top Inbound Agent" and "Top Outbound Agent" — same widget,
// different `direction` input, following the pattern already used for
// inbound/outbound elsewhere in this dashboard (DRY over two near-duplicate
// components).
//
// Unlike a plain "who has the most calls this tick" readout, this tracks a
// running high-water mark per the spec: the displayed leader only ever
// changes when a new value exceeds the current max, and the whole board
// resets once every 24 hours. See TopAgentTracker for that logic — kept as
// a plain, independently unit-tested class so each instance of this
// component owns fully isolated state (no cross-module state leakage).
@Component({
  selector: 'app-top-agent',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './top-agent.component.html',
  styleUrl: './top-agent.component.scss',
})
export class TopAgentComponent {
  readonly direction = input.required<CallDirection>();
  readonly agents = input<Agent[]>([]);

  readonly title = computed(() => (this.direction() === 'inbound' ? 'Top Inbound Agent' : 'Top Outbound Agent'));

  // A plain signal the effect writes into directly, NOT a computed() that
  // conditionally reads the tracker. An earlier version used
  // `computed(() => this.trackerInstance?.top() ?? null)`: on its very
  // first evaluation (before the effect below has run once),
  // `trackerInstance` is still null, so the `?.` short-circuits and the
  // computed reads zero signals that time. Angular then treats it as
  // having no reactive dependencies and never recomputes it again — `top`
  // would silently freeze at null forever, even after the effect later
  // populates the tracker. Caught by top-agent.component.spec.ts.
  private readonly _top = signal<TopAgentSnapshot | null>(null);
  readonly top = this._top.asReadonly();

  private trackerInstance: TopAgentTracker | null = null;

  constructor() {
    // Runs after inputs are bound (effects are scheduled, not synchronous),
    // so it's safe to read `direction()`/`agents()` here on every change.
    effect(
      () => {
        if (!this.trackerInstance) {
          this.trackerInstance = new TopAgentTracker(`top-agent-tracker:${this.direction()}`);
        }
        const direction = this.direction();
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
