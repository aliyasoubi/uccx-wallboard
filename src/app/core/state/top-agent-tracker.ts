import { signal } from '@angular/core';

export const TOP_AGENT_RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface TopAgentSnapshot {
  agentId: string;
  agentName: string;
  value: number;
}

export interface AgentMetricSource {
  id: string;
  name: string;
  value: number;
}

interface PersistedState {
  top: TopAgentSnapshot | null;
  resetAt: number;
}

/**
 * Tracks the best-performing agent for one metric (e.g. inbound calls) as a
 * running, monotonically-increasing high-water mark: the displayed value
 * only ever goes up within a 24-hour window, even if the live snapshot dips
 * (a quiet polling tick, a metric that briefly recalculates downward, etc).
 *
 * Deliberately a plain class, not an Angular service/DI singleton: each
 * "Top Inbound Agent" / "Top Outbound Agent" widget constructs its own
 * instance (see TopInboundAgentComponent / TopOutboundAgentComponent, both
 * built on TopAgentBase), so there is no shared mutable state
 * between dashboard modules — each tracker only knows about the one metric
 * it was built for.
 *
 * State survives a page refresh via localStorage (keyed by `storageKey`,
 * which callers should namespace per direction, e.g.
 * "top-agent-tracker:inbound") so a wallboard reload mid-shift doesn't
 * silently lose the day's record. If localStorage is unavailable (private
 * browsing, storage quota, etc.) the tracker still works for the current
 * session, in memory only.
 */
export class TopAgentTracker {
  private readonly _top = signal<TopAgentSnapshot | null>(null);
  private resetAt: number;

  readonly top = this._top.asReadonly();

  constructor(
    private readonly storageKey: string,
    private readonly now: () => number = () => Date.now(),
  ) {
    const restored = this.restore();
    this._top.set(restored?.top ?? null);
    this.resetAt = restored?.resetAt ?? this.now() + TOP_AGENT_RESET_INTERVAL_MS;
  }

  /**
   * Call with the latest per-agent values every time a new snapshot
   * arrives. Resets first if the 24-hour window has elapsed, then raises
   * the tracked max if any agent's current value exceeds it.
   */
  evaluate(agents: readonly AgentMetricSource[]): void {
    this.resetIfWindowElapsed();

    const currentTop = agents.reduce<AgentMetricSource | null>(
      (best, agent) => (!best || agent.value > best.value ? agent : best),
      null,
    );
    if (!currentTop) return;

    const previousMax = this._top()?.value ?? -Infinity;
    if (currentTop.value > previousMax) {
      this._top.set({
        agentId: currentTop.id,
        agentName: currentTop.name,
        value: currentTop.value,
      });
      this.persist();
    }
  }

  private resetIfWindowElapsed(): void {
    if (this.now() < this.resetAt) return;
    this._top.set(null);
    this.resetAt = this.now() + TOP_AGENT_RESET_INTERVAL_MS;
    this.persist();
  }

  private persist(): void {
    try {
      const state: PersistedState = { top: this._top(), resetAt: this.resetAt };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // Storage unavailable — tracker keeps working in-memory for this session.
    }
  }

  private restore(): PersistedState | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (typeof parsed.resetAt !== 'number') return null;
      return { top: parsed.top ?? null, resetAt: parsed.resetAt };
    } catch {
      return null;
    }
  }
}
