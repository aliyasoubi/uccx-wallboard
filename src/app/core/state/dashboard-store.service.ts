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
  // Typed from the shared ConnectionState union, not a second inline copy of
  // it — this signal used to redeclare 'live' | 'stale' | 'error' itself,
  // which meant adding 'connecting' to the real type didn't touch this
  // literal until it was caught by hand.
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
      this._callSummary.set(snapshot.callSummary);
      this._serviceMetrics.set(snapshot.serviceMetrics);
      this._agentStateSummary.set(snapshot.agentStateSummary);
      this._agents.set(snapshot.agents);
      this._queues.set(snapshot.queues);
      this._agentOfMonth.set(snapshot.agentOfMonth);
      this._inboundStats.set(snapshot.inboundStats);
      this._outboundStats.set(snapshot.outboundStats);
      this._lastUpdated.set(new Date(snapshot.fetchedAt));
    });

    this.dataSource.connectionState$.pipe(takeUntilDestroyed()).subscribe((state) => {
      this._connectionState.set(state);
    });
  }
}
