import { mapCallDirectionStats } from './call-direction-stats.mapper';
import { AgentDto } from '../models/dto';

function buildAgentDto(inboundTotal: number, outboundTotal: number): AgentDto {
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
    outboundCallStats: { totalTalkDuration: 0, avgTalkDuration: 0, maxTalkDuration: 0, totalCalls: outboundTotal },
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
    const stats = mapCallDirectionStats([buildAgentDto(20, 6), buildAgentDto(26, 8), buildAgentDto(12, 4)], 'inbound');
    expect(stats.topAgentCalls).toBe(26);
    expect(stats.lowestAgentCalls).toBe(12);
  });

  it('returns zeroed stats for an empty roster instead of Number.MAX_SAFE_INTEGER', () => {
    const stats = mapCallDirectionStats([], 'inbound');
    expect(stats).toEqual({ direction: 'inbound', count: 0, topAgentCalls: 0, lowestAgentCalls: 0 });
  });

  it('echoes back the requested direction', () => {
    expect(mapCallDirectionStats([], 'outbound').direction).toBe('outbound');
  });
});
