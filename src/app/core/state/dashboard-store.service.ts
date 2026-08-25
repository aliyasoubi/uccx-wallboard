import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Agent,
  AgentOfMonth,
  AgentStateSummary,
  CallDirectionStats,
  CallSummary,
  Queue,
  ServiceMetrics,
} from '../models/domain';
import { ConnectionState, DATA_SOURCE } from '../data-access/data-source.token';

// Single source of truth for dashboard data. Components read signals from
// here — no component ever calls HTTP or the DataSource directly.
@Injectable({ providedIn: 'root' })
export class DashboardStoreService {
  private readonly dataSource = inject(DATA_SOURCE);

  private readonly _callSummary = signal<CallSummary | null>(null);
  private readonly _serviceMetrics = signal<ServiceMetrics | null>(null);
  private readonly _agentStateSummary = signal<AgentStateSummary | null>(null);
  private readonly _agents = signal<Agent[]>([]);
  private readonly _queues = signal<Queue[]>([]);
  private readonly _agentOfMonth = signal<AgentOfMonth | null>(null);
  private readonly _inboundStats = signal<CallDirectionStats | null>(null);
  private readonly _outboundStats = signal<CallDirectionStats | null>(null);
  private readonly _lastUpdated = signal<Date | null>(null);
  private readonly _connectionState = signal<ConnectionState>('connecting');

  readonly callSummary = this._callSummary.asReadonly();
  readonly serviceMetrics = this._serviceMetrics.asReadonly();
  readonly agentStateSummary = this._agentStateSummary.asReadonly();
  readonly agents = this._agents.asReadonly();
  readonly queues = this._queues.asReadonly();
  readonly agentOfMonth = this._agentOfMonth.asReadonly();
  readonly inboundStats = this._inboundStats.asReadonly();
  readonly outboundStats = this._outboundStats.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();
  readonly connectionState = this._connectionState.asReadonly();

  // Derived state, computed once and reused by every component that needs
  // it — this is what replaces the duplicated inline logic from the old app.
  readonly readyAgentsCount = computed(
    () => this.agents().filter((a) => a.status === 'ready').length,
  );

  constructor() {
    this.dataSource.updates$.pipe(takeUntilDestroyed()).subscribe((snapshot) => {
      // Every field but fetchedAt can be null on a partial poll (see
      // DashboardSnapshot) — null means "this resource failed to load THIS
      // tick", not "the real value is empty". Skipping the .set() call for
      // a null field leaves that signal at whatever it already held, so one
      // bad endpoint dims only its own widgets instead of blanking the
      // whole board. A signal only ever regresses to empty/null when its
      // OWN field genuinely reports empty data, never as a side effect of
      // an unrelated field failing.
      if (snapshot.callSummary !== null) this._callSummary.set(snapshot.callSummary);
      if (snapshot.serviceMetrics !== null) this._serviceMetrics.set(snapshot.serviceMetrics);
      if (snapshot.agentStateSummary !== null) {
        this._agentStateSummary.set(snapshot.agentStateSummary);
      }
      if (snapshot.agents !== null) this._agents.set(snapshot.agents);
      if (snapshot.queues !== null) this._queues.set(snapshot.queues);
      if (snapshot.agentOfMonth !== null) this._agentOfMonth.set(snapshot.agentOfMonth);
      if (snapshot.inboundStats !== null) this._inboundStats.set(snapshot.inboundStats);
      if (snapshot.outboundStats !== null) this._outboundStats.set(snapshot.outboundStats);
      // fetchedAt always advances, even on a partial poll — see FooterComponent's
      // staleness display, which is about "did we hear from the BFF at all
      // recently", not "is every widget's data fresh".
      this._lastUpdated.set(new Date(snapshot.fetchedAt));
    });

    this.dataSource.connectionState$.pipe(takeUntilDestroyed()).subscribe((state) => {
      this._connectionState.set(state);
    });
  }
}
