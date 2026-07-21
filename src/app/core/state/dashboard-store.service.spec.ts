import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DashboardStoreService } from './dashboard-store.service';
import { DATA_SOURCE, DataSource } from '../data-access/data-source.token';
import { AgentStatus, DashboardSnapshot } from '../models/domain';

function buildSnapshot(overrides: Partial<DashboardSnapshot> = {}): DashboardSnapshot {
  return {
    callSummary: {
      totalCalls: 10,
      handledCalls: 8,
      abandonedCalls: 2,
      avgWaitSeconds: 20,
      avgTalkSeconds: 100,
      callsWaiting: 1,
    },
    serviceMetrics: { slaPercent: 90, csatScore: 4.5, fcrPercent: 80 },
    agentStateSummary: { total: 2, ready: 1, talking: 1, notReady: 0 },
    agents: [
      {
        id: 'A1',
        name: 'John',
        status: AgentStatus.Ready,
        statusDurationSeconds: 60,
        reason: null,
        inboundCalls: 5,
        outboundCalls: 1,
      },
      {
        id: 'A2',
        name: 'Sarah',
        status: AgentStatus.Talking,
        statusDurationSeconds: 30,
        reason: null,
        inboundCalls: 8,
        outboundCalls: 2,
      },
    ],
    queues: [],
    agentOfMonth: { agentId: 'A1', name: 'John', photoUrl: null },
    inboundStats: { direction: 'inbound', count: 13, topAgentCalls: 8, lowestAgentCalls: 5 },
    outboundStats: { direction: 'outbound', count: 3, topAgentCalls: 2, lowestAgentCalls: 1 },
    fetchedAt: '2026-07-21T08:00:00.000Z',
    ...overrides,
  };
}

describe('DashboardStoreService', () => {
  let updates$: Subject<DashboardSnapshot>;
  let connectionState$: Subject<'live' | 'stale' | 'error'>;
  let store: DashboardStoreService;

  beforeEach(() => {
    updates$ = new Subject<DashboardSnapshot>();
    connectionState$ = new Subject<'live' | 'stale' | 'error'>();
    const fakeDataSource: DataSource = { updates$, connectionState$ };

    TestBed.configureTestingModule({
      providers: [{ provide: DATA_SOURCE, useValue: fakeDataSource }],
    });
    store = TestBed.inject(DashboardStoreService);
  });

  it('starts with empty/null signals before any snapshot arrives', () => {
    expect(store.callSummary()).toBeNull();
    expect(store.agents()).toEqual([]);
    expect(store.lastUpdated()).toBeNull();
  });

  it('populates every signal from an incoming snapshot', () => {
    const snapshot = buildSnapshot();
    updates$.next(snapshot);

    expect(store.callSummary()).toEqual(snapshot.callSummary);
    expect(store.serviceMetrics()).toEqual(snapshot.serviceMetrics);
    expect(store.agentStateSummary()).toEqual(snapshot.agentStateSummary);
    expect(store.agents()).toEqual(snapshot.agents);
    expect(store.queues()).toEqual(snapshot.queues);
    expect(store.agentOfMonth()).toEqual(snapshot.agentOfMonth);
    expect(store.inboundStats()).toEqual(snapshot.inboundStats);
    expect(store.outboundStats()).toEqual(snapshot.outboundStats);
    expect(store.lastUpdated()).toEqual(new Date(snapshot.fetchedAt));
  });

  it('derives readyAgentsCount from the current agent roster', () => {
    updates$.next(buildSnapshot());
    // One of the two seeded agents is Ready, the other Talking.
    expect(store.readyAgentsCount()).toBe(1);
  });

  it('updates connectionState from the DataSource connectionState$ stream', () => {
    connectionState$.next('stale');
    expect(store.connectionState()).toBe('stale');

    connectionState$.next('error');
    expect(store.connectionState()).toBe('error');
  });

  it('overwrites previous values on each new snapshot rather than merging', () => {
    updates$.next(buildSnapshot({ agents: [] }));
    expect(store.agents()).toEqual([]);

    updates$.next(buildSnapshot());
    expect(store.agents().length).toBe(2);
  });
});
