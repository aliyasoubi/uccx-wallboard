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
    expect(store.agents()).toEqual(snapshot.agents!);
    expect(store.queues()).toEqual(snapshot.queues!);
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

  // The whole point of Phase 1: BffClientService now emits `null` for any
  // field whose endpoint failed THIS poll (see DashboardSnapshot), and the
  // store's job is to leave that one signal exactly where it was — not
  // reset it to empty/null — so one bad endpoint dims only its own widgets
  // instead of blanking the whole board.
  describe('partial snapshots (one or more fields null)', () => {
    it('preserves the previous value of a field that comes back null', () => {
      updates$.next(buildSnapshot());

      // Simulate the agent-of-month endpoint failing this tick — every
      // other field still present, only agentOfMonth null.
      updates$.next(buildSnapshot({ agentOfMonth: null }));

      expect(store.agentOfMonth()).toEqual({ agentId: 'A1', name: 'John', photoUrl: null }); // unchanged
      // The other fields were genuinely present this tick, so they DO
      // re-set as normal — that's a separate guarantee, covered by the
      // "still applies every field that DID come back" test below.
      expect(store.agents().length).toBe(2);
      expect(store.queues()).toEqual([]);
    });

    it('preserves every previous value when every field comes back null except fetchedAt', () => {
      updates$.next(buildSnapshot());
      const before = {
        callSummary: store.callSummary(),
        serviceMetrics: store.serviceMetrics(),
        agentStateSummary: store.agentStateSummary(),
        agents: store.agents(),
        queues: store.queues(),
        agentOfMonth: store.agentOfMonth(),
        inboundStats: store.inboundStats(),
        outboundStats: store.outboundStats(),
      };

      updates$.next(
        buildSnapshot({
          callSummary: null,
          serviceMetrics: null,
          agentStateSummary: null,
          agents: null,
          queues: null,
          agentOfMonth: null,
          inboundStats: null,
          outboundStats: null,
          fetchedAt: '2026-07-21T08:00:03.000Z',
        }),
      );

      expect(store.callSummary()).toEqual(before.callSummary!);
      expect(store.serviceMetrics()).toEqual(before.serviceMetrics!);
      expect(store.agentStateSummary()).toEqual(before.agentStateSummary!);
      expect(store.agents()).toEqual(before.agents);
      expect(store.queues()).toEqual(before.queues);
      expect(store.agentOfMonth()).toEqual(before.agentOfMonth!);
      expect(store.inboundStats()).toEqual(before.inboundStats!);
      expect(store.outboundStats()).toEqual(before.outboundStats!);
      // fetchedAt is the one field that always advances — it answers "did we
      // hear from the BFF at all", not "is every widget's data fresh".
      expect(store.lastUpdated()).toEqual(new Date('2026-07-21T08:00:03.000Z'));
    });

    it('still applies every field that DID come back, alongside the ones that did not', () => {
      updates$.next(buildSnapshot());
      const newQueues = [
        {
          name: 'Sales',
          totalCalls: 5,
          handledCalls: 4,
          abandonedCalls: 1,
          avgWaitSeconds: 10,
          callsWaiting: 0,
          agentStates: { total: 1, ready: 1, talking: 0, notReady: 0 },
          slaPercent: 99,
          currentWaitSeconds: 0,
          maxWaitSeconds: 30,
          avgTalkSeconds: 90,
        },
      ];

      updates$.next(buildSnapshot({ agentOfMonth: null, queues: newQueues }));

      expect(store.queues()).toEqual(newQueues); // the field that succeeded updates normally
      expect(store.agentOfMonth()).toEqual({ agentId: 'A1', name: 'John', photoUrl: null }); // the failed one holds
    });

    // A real empty result ([]) must still overwrite — null and [] are not
    // the same thing (see DashboardSnapshot's doc comment).
    it('distinguishes a genuinely empty roster/queue list ([]) from a failed fetch (null)', () => {
      updates$.next(buildSnapshot());
      expect(store.agents().length).toBe(2);

      updates$.next(buildSnapshot({ agents: [] }));
      expect(store.agents()).toEqual([]);
    });
  });
});
