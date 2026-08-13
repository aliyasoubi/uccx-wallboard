import { mapQueue, mapQueues } from './queue.mapper';
import { CsqDto } from '../models/dto';

function buildCsqDto(overrides: Partial<CsqDto> = {}): CsqDto {
  return {
    name: 'Sales',
    callStats: {
      totalTalkDuration: 3400,
      maxTalkDuration: 720,
      avgTalkDuration: 260,
      maxWaitDuration: 95,
      avgWaitDuration: 32,
      avgHandleDuration: 292,
      totalCalls: 210,
      abandonedCalls: 5,
      handledCalls: 205,
      waitingCalls: 2,
    },
    agentStateCounts: { total: 12, ready: 5, talking: 4, notReady: 3 },
    serviceMetrics: { sla: 96.1, csat: 4.7, fcr: 81.2 },
    timings: { currentWaitDuration: 28 },
    ...overrides,
  };
}

describe('queue.mapper', () => {
  it('maps call stats to the domain shape, correcting the historical handledlCalls typo', () => {
    const queue = mapQueue(buildCsqDto());
    expect(queue.totalCalls).toBe(210);
    expect(queue.handledCalls).toBe(205);
    expect(queue.abandonedCalls).toBe(5);
    expect(queue.avgWaitSeconds).toBe(32);
    expect(queue.callsWaiting).toBe(2);
  });

  it('maps agentStateCounts to agentStates', () => {
    const queue = mapQueue(buildCsqDto());
    expect(queue.agentStates).toEqual({ total: 12, ready: 5, talking: 4, notReady: 3 });
  });

  // Regression test: CsqDto.serviceMetrics was declared on the DTO but the
  // old mapper never read it, so per-queue SLA silently never reached the
  // UI even though the field existed on the wire. Locks in the fix.
  it('maps dto.serviceMetrics.sla to slaPercent (previously dropped contract drift)', () => {
    const queue = mapQueue(buildCsqDto({ serviceMetrics: { sla: 88.4, csat: 4.3, fcr: 74.6 } }));
    expect(queue.slaPercent).toBe(88.4);
  });

  // CWD still comes from the timings block, but MWD and ACT are now read off
  // callStats — QueueTimingStatsDto no longer carries them. All three
  // acronyms' meanings, and this re-sourcing, remain unconfirmed against the
  // real backend (see the Queue domain model); this test locks in the current
  // wiring, not a ratified contract.
  it('maps CWD from timings and MWD/ACT from callStats', () => {
    const queue = mapQueue(
      buildCsqDto({
        timings: { currentWaitDuration: 61 },
        callStats: { ...buildCsqDto().callStats, maxWaitDuration: 133, avgHandleDuration: 372 },
      }),
    );
    expect(queue.currentWaitSeconds).toBe(61);
    expect(queue.maxWaitSeconds).toBe(133);
    expect(queue.avgTalkSeconds).toBe(372);
  });

  it('maps an array of queues in order', () => {
    const queues = mapQueues([buildCsqDto({ name: 'Sales' }), buildCsqDto({ name: 'Support' })]);
    expect(queues.map((q) => q.name)).toEqual(['Sales', 'Support']);
  });
});
