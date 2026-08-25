import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BffClientService } from './bff-client.service';
import { AppConfigService } from '../config/app-config.service';

// BffClientService.base reads environment.useMockFixtures directly from the
// bundled environment.ts, ahead of anything a test can inject — the
// AppConfigService.apiBaseUrl stub below only takes effect when that flag is
// false. The dev environment.ts checked into this repo has it `true` (no
// real BFF exists yet), so these routes target the fixture files actually
// requested in that mode, not a fictitious real API base.
const FIXTURES_BASE = 'assets/fixtures';

// One of each resource's route, in the exact order fetchSnapshot() requests
// them — used to flush/error each independently per test.
const ROUTES = {
  agents: `${FIXTURES_BASE}/AgentStates.json`,
  inboundCallStats: `${FIXTURES_BASE}/InboundCallStats.json`,
  outboundCallStats: `${FIXTURES_BASE}/OutboundCallStats.json`,
  serviceMetrics: `${FIXTURES_BASE}/CustomerServiceMetrics.json`,
  agentStateCounts: `${FIXTURES_BASE}/AgentStateStats.json`,
  queues: `${FIXTURES_BASE}/CsqStats.json`,
  agentOfMonth: `${FIXTURES_BASE}/AgentOfMonth.json`,
};

function agentDto(id: string, inboundTotal: number, outboundTotal: number) {
  return {
    id,
    name: `Agent ${id}`,
    state: { state: 'Ready', duration: 0, reason: '' },
    stateStats: {
      logonDuration: 0,
      totalReadyDuration: 0,
      maxReadyDuration: 0,
      avgReadyDuration: 0,
      totalNotReadyDuration: 0,
      maxNotReadyDuration: 0,
      avgNotReadyDuration: 0,
    },
    inboundCallStats: {
      totalTalkDuration: 0,
      avgTalkDuration: 0,
      maxTalkDuration: 0,
      totalHoldDuration: 0,
      avgHoldDuration: 0,
      maxHoldDuration: 0,
      totalWorkDuration: 0,
      avgWorkDuration: 0,
      maxWorkDuration: 0,
      totalCalls: inboundTotal,
      handledCalls: 0,
      abandonedCalls: 0,
    },
    outboundCallStats: {
      totalTalkDuration: 0,
      avgTalkDuration: 0,
      maxTalkDuration: 0,
      totalCalls: outboundTotal,
    },
  };
}

const AGENTS_DTO = [agentDto('A1', 20, 6), agentDto('A2', 26, 8)];
const INBOUND_DTO = {
  totalTalkDuration: 800,
  avgTalkDuration: 33,
  maxTalkDuration: 230,
  avgWaitDuration: 50,
  maxWaitDuration: 77,
  avgHandleDuration: 61,
  totalCalls: 47,
  handledCalls: 11,
  abandonedCalls: 31,
  waitingCalls: 5,
};
const OUTBOUND_DTO = {
  totalTalkDuration: 3000,
  avgTalkDuration: 111,
  maxTalkDuration: 400,
  totalCalls: 80,
};
const SERVICE_METRICS_DTO = { sla: 94.6, csat: 4.6, fcr: 79.8 };
const AGENT_STATE_COUNTS_DTO = { total: 9, ready: 4, talking: 1, notReady: 4 };
const QUEUES_DTO = [
  {
    name: 'Sales',
    callStats: {
      totalTalkDuration: 500,
      avgTalkDuration: 200,
      maxTalkDuration: 300,
      avgWaitDuration: 10,
      maxWaitDuration: 61,
      avgHandleDuration: 15,
      totalCalls: 100,
      handledCalls: 70,
      abandonedCalls: 25,
      waitingCalls: 5,
    },
    agentStateCounts: { total: 12, ready: 5, talking: 4, notReady: 3 },
    serviceMetrics: { sla: 96.1, csat: 4.7, fcr: 81.2 },
    timings: { currentWaitDuration: 28 },
  },
];
const AGENT_OF_MONTH_DTO = { agentID: 'A1', photoUrl: '' };

describe('BffClientService', () => {
  let service: BffClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Unused while environment.useMockFixtures is true (see ROUTES above),
        // but every real-mode consumer of AppConfigService.config() should be
        // able to inject something — a stub documents that dependency instead
        // of relying on the real service's HTTP-loaded fallback by accident.
        {
          provide: AppConfigService,
          useValue: {
            config: () => ({ apiBaseUrl: 'https://bff.example.com/api', pollIntervalMs: 3000 }),
          },
        },
      ],
    });
    service = TestBed.inject(BffClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Flushes every route with its default success payload, except the ones
  // listed in `except`, which get an HTTP error instead — models a poll
  // where those specific resources failed.
  function flushAll(except: Partial<Record<keyof typeof ROUTES, true>> = {}) {
    const flush = <T>(key: keyof typeof ROUTES, body: T) => {
      const req = httpMock.expectOne(ROUTES[key]);
      if (except[key]) {
        req.flush('boom', { status: 500, statusText: 'Server Error' });
      } else {
        req.flush(body as never);
      }
    };
    flush('agents', AGENTS_DTO);
    flush('inboundCallStats', INBOUND_DTO);
    flush('outboundCallStats', OUTBOUND_DTO);
    flush('serviceMetrics', SERVICE_METRICS_DTO);
    flush('agentStateCounts', AGENT_STATE_COUNTS_DTO);
    flush('queues', QUEUES_DTO);
    flush('agentOfMonth', AGENT_OF_MONTH_DTO);
  }

  it('builds a fully-populated snapshot when every endpoint succeeds', (done) => {
    service.fetchSnapshot().subscribe((snapshot) => {
      expect(snapshot.callSummary).not.toBeNull();
      expect(snapshot.serviceMetrics).toEqual({
        slaPercent: 94.6,
        csatScore: 4.6,
        fcrPercent: 79.8,
      });
      expect(snapshot.agentStateSummary).toEqual(AGENT_STATE_COUNTS_DTO);
      expect(snapshot.agents!.length).toBe(2);
      expect(snapshot.queues!.length).toBe(1);
      expect(snapshot.agentOfMonth).toEqual({ agentId: 'A1', name: 'Agent A1', photoUrl: null });
      expect(snapshot.inboundStats).toEqual({
        direction: 'inbound',
        count: 46,
        topAgentCalls: 26,
        lowestAgentCalls: 20,
      });
      expect(snapshot.outboundStats!.count).toBe(80); // from the dedicated endpoint, not summed from the roster (6+8=14)
      done();
    });
    flushAll();
  });

  // The behavior Phase 1 exists for: one bad endpoint must not take the
  // other six down with it.
  it('degrades only the field whose endpoint failed, leaving every other field populated', (done) => {
    service.fetchSnapshot().subscribe((snapshot) => {
      expect(snapshot.agentOfMonth).toBeNull();
      expect(snapshot.callSummary).not.toBeNull();
      expect(snapshot.serviceMetrics).not.toBeNull();
      expect(snapshot.agentStateSummary).not.toBeNull();
      expect(snapshot.agents).not.toBeNull();
      expect(snapshot.queues).not.toBeNull();
      expect(snapshot.inboundStats).not.toBeNull();
      expect(snapshot.outboundStats).not.toBeNull();
      done();
    });
    flushAll({ agentOfMonth: true });
  });

  it('degrades multiple independently-failed fields at once, each to null on its own', (done) => {
    service.fetchSnapshot().subscribe((snapshot) => {
      expect(snapshot.queues).toBeNull();
      expect(snapshot.serviceMetrics).toBeNull();
      expect(snapshot.callSummary).not.toBeNull();
      expect(snapshot.agents).not.toBeNull();
      done();
    });
    flushAll({ queues: true, serviceMetrics: true });
  });

  // agents is a join key several other fields depend on — its absence must
  // propagate to exactly its dependents, not to unrelated fields.
  it('degrades roster-dependent fields (agentOfMonth, inboundStats) when agents fails, without affecting unrelated fields', (done) => {
    service.fetchSnapshot().subscribe((snapshot) => {
      expect(snapshot.agents).toBeNull();
      expect(snapshot.agentOfMonth).toBeNull();
      expect(snapshot.inboundStats).toBeNull();
      // callSummary depends on inboundCallStats only, not on agents.
      expect(snapshot.callSummary).not.toBeNull();
      expect(snapshot.queues).not.toBeNull();
      expect(snapshot.serviceMetrics).not.toBeNull();
      done();
    });
    flushAll({ agents: true });
  });

  // outboundStats' count comes from its own dedicated endpoint (see
  // mapOutboundCallDirectionStats) — losing it must null the whole field,
  // not silently fall back to a roster-only sum that omits logged-out agents.
  it('nulls outboundStats when outboundCallStats fails, even though agents succeeded', (done) => {
    service.fetchSnapshot().subscribe((snapshot) => {
      expect(snapshot.outboundStats).toBeNull();
      expect(snapshot.agents).not.toBeNull();
      expect(snapshot.inboundStats).not.toBeNull(); // unaffected — different endpoint entirely
      done();
    });
    flushAll({ outboundCallStats: true });
  });

  it('still resolves outboundStats (roster-derived parts zeroed) when agents fails but outboundCallStats succeeds', (done) => {
    service.fetchSnapshot().subscribe((snapshot) => {
      expect(snapshot.outboundStats).toEqual({
        direction: 'outbound',
        count: 80, // still authoritative from its own endpoint
        topAgentCalls: 0, // roster-derived parts degrade to the empty-roster default
        lowestAgentCalls: 0,
      });
      done();
    });
    flushAll({ agents: true });
  });

  // The one case that must still read as a genuinely failed poll: nothing
  // came back at all. PollingDataSource's stale/error escalation depends on
  // fetchSnapshot() erroring here, not silently emitting an all-null snapshot.
  it('errors the whole observable when every endpoint fails, rather than emitting an all-null snapshot', (done) => {
    service.fetchSnapshot().subscribe({
      next: () => fail('expected an error, not a value'),
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      },
    });
    flushAll({
      agents: true,
      inboundCallStats: true,
      outboundCallStats: true,
      serviceMetrics: true,
      agentStateCounts: true,
      queues: true,
      agentOfMonth: true,
    });
  });

  it('still succeeds with a snapshot when at least one endpoint returns real data', (done) => {
    service.fetchSnapshot().subscribe((snapshot) => {
      expect(snapshot.serviceMetrics).not.toBeNull();
      expect(snapshot.agents).toBeNull();
      expect(snapshot.callSummary).toBeNull();
      done();
    });
    flushAll({
      agents: true,
      inboundCallStats: true,
      outboundCallStats: true,
      agentStateCounts: true,
      queues: true,
      agentOfMonth: true,
    });
  });

  it('sets fetchedAt to the current time even on a partial poll', (done) => {
    const before = Date.now();
    service.fetchSnapshot().subscribe((snapshot) => {
      const fetchedAt = new Date(snapshot.fetchedAt).getTime();
      expect(fetchedAt).toBeGreaterThanOrEqual(before);
      expect(fetchedAt).toBeLessThanOrEqual(Date.now());
      done();
    });
    flushAll({ agentOfMonth: true });
  });
});
