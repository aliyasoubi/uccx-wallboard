import {
  mapCallDirectionStats,
  mapInboundCallDirectionStats,
  mapOutboundCallDirectionStats,
} from './call-direction-stats.mapper';
import { AgentDto, InboundCallStatsDto, OutboundCallStatsDto } from '../models/dto';

function buildAgentDto(
  inboundTotal: number,
  outboundTotal: number,
  inboundTalk = 0,
  outboundTalk = 0,
): AgentDto {
  return {
    id: `A-${inboundTotal}-${outboundTotal}`,
    name: 'Agent',
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
      totalTalkDuration: inboundTalk,
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
      totalTalkDuration: outboundTalk,
      avgTalkDuration: 0,
      maxTalkDuration: 0,
      totalCalls: outboundTotal,
    },
  };
}

describe('call-direction-stats.mapper', () => {
  it('sums inbound calls across agents', () => {
    const stats = mapCallDirectionStats([buildAgentDto(20, 6), buildAgentDto(26, 8)], 'inbound');
    expect(stats.count).toBe(46);
  });

  it('sums outbound calls across agents', () => {
    const stats = mapCallDirectionStats([buildAgentDto(20, 6), buildAgentDto(26, 8)], 'outbound');
    expect(stats.count).toBe(14);
  });

  it('reports the top and lowest agent totals for the requested direction', () => {
    const stats = mapCallDirectionStats(
      [buildAgentDto(20, 6), buildAgentDto(26, 8), buildAgentDto(12, 4)],
      'inbound',
    );
    expect(stats.topAgentCalls).toBe(26);
    expect(stats.lowestAgentCalls).toBe(12);
  });

  it('returns zeroed stats for an empty roster instead of Number.MAX_SAFE_INTEGER', () => {
    const stats = mapCallDirectionStats([], 'inbound');
    expect(stats).toEqual({
      direction: 'inbound',
      count: 0,
      totalTalkSeconds: 0,
      topAgentCalls: 0,
      lowestAgentCalls: 0,
    });
  });

  it('echoes back the requested direction', () => {
    expect(mapCallDirectionStats([], 'outbound').direction).toBe('outbound');
  });
});

describe('mapInboundCallDirectionStats', () => {
  const inboundDto: InboundCallStatsDto = {
    totalTalkDuration: 81105,
    avgTalkDuration: 33,
    maxTalkDuration: 230,
    avgWaitDuration: 50,
    maxWaitDuration: 77,
    avgHandleDuration: 61,
    totalCalls: 718,
    handledCalls: 566,
    abandonedCalls: 152,
    waitingCalls: 5,
  };

  // The whole point of this function: an agent who handled calls earlier and
  // has since logged out is gone from the roster but still counted by the
  // endpoint, so a roster sum under-reports the day's real volume.
  it('takes count and talk time from the inbound endpoint, not from the agent roster', () => {
    const stats = mapInboundCallDirectionStats(inboundDto, [
      buildAgentDto(20, 6, 500),
      buildAgentDto(26, 8, 700),
    ]);
    expect(stats.count).toBe(718);
    expect(stats.totalTalkSeconds).toBe(81105);
    expect(stats.direction).toBe('inbound');
  });

  it('still derives top and lowest agent totals from the roster', () => {
    const stats = mapInboundCallDirectionStats(inboundDto, [
      buildAgentDto(20, 6),
      buildAgentDto(26, 8),
      buildAgentDto(12, 4),
    ]);
    expect(stats.topAgentCalls).toBe(26);
    expect(stats.lowestAgentCalls).toBe(12);
  });

  it('never leaks the Number.MAX_SAFE_INTEGER sentinel for an empty roster', () => {
    const stats = mapInboundCallDirectionStats(inboundDto, []);
    expect(stats.lowestAgentCalls).toBe(0);
    expect(stats.topAgentCalls).toBe(0);
    expect(stats.count).toBe(718);
  });
});

describe('mapOutboundCallDirectionStats', () => {
  const outboundDto: OutboundCallStatsDto = {
    totalTalkDuration: 3000,
    avgTalkDuration: 111,
    maxTalkDuration: 400,
    totalCalls: 80,
  };

  it('takes talk time from the outbound endpoint, not from the agent roster', () => {
    const stats = mapOutboundCallDirectionStats(outboundDto, [
      buildAgentDto(20, 6, 0, 111),
      buildAgentDto(26, 8, 0, 222),
    ]);
    expect(stats.totalTalkSeconds).toBe(3000);
  });

  it('takes the total from the outbound endpoint, not from the agent roster', () => {
    // 6 + 8 = 14 across the roster, but the endpoint is authoritative for
    // volume (it includes calls by agents who have since logged out).
    const stats = mapOutboundCallDirectionStats(outboundDto, [
      buildAgentDto(20, 6),
      buildAgentDto(26, 8),
    ]);
    expect(stats.count).toBe(80);
    expect(stats.direction).toBe('outbound');
  });

  it('derives top and lowest agent totals from the roster outbound counts', () => {
    const stats = mapOutboundCallDirectionStats(outboundDto, [
      buildAgentDto(20, 6),
      buildAgentDto(26, 8),
      buildAgentDto(12, 4),
    ]);
    expect(stats.topAgentCalls).toBe(8);
    expect(stats.lowestAgentCalls).toBe(4);
  });

  // Regression guard: this function used to hardcode topAgentCalls to 0 and
  // return the Number.MAX_SAFE_INTEGER sentinel as lowestAgentCalls, which is
  // exactly what the sibling mapper's empty-roster test above forbids.
  it('never leaks the Number.MAX_SAFE_INTEGER sentinel for an empty roster', () => {
    const stats = mapOutboundCallDirectionStats(outboundDto, []);
    expect(stats.lowestAgentCalls).toBe(0);
    expect(stats.topAgentCalls).toBe(0);
    expect(stats.count).toBe(80);
  });
});
