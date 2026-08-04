import { mapCallSummary } from './call-summary.mapper';
import { InboundCallStatsDto } from '../models/dto';

describe('call-summary.mapper', () => {
  const dto: InboundCallStatsDto = {
    maxTalkDuration: 950,
    avgTalkDuration: 312,
    maxWaitDuration: 180,
    avgWaitDuration: 48,
    abandonedCalls: 17,
    handledCalls: 483,
    totalCalls: 500,
    waitingCalls: 6,
  };

  it('maps every field to its domain counterpart', () => {
    const summary = mapCallSummary(dto);
    expect(summary).toEqual({
      totalCalls: 500,
      handledCalls: 483,
      abandonedCalls: 17,
      avgWaitSeconds: 48,
      avgTalkSeconds: 312,
      callsWaiting: 6,
    });
  });

  it('does not swap avgWaitDuration and avgTalkDuration (regression guard)', () => {
    const summary = mapCallSummary(dto);
    expect(summary.avgWaitSeconds).toBe(dto.avgWaitDuration);
    expect(summary.avgTalkSeconds).toBe(dto.avgTalkDuration);
  });
});
