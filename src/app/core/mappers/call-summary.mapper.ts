import { InboundCallStatsDto } from '../models/dto';
import { CallSummary } from '../models/domain';

export function mapCallSummary(dto: InboundCallStatsDto): CallSummary {
  return {
    totalCalls: dto.totalCalls,
    handledCalls: dto.handledCalls,
    abandonedCalls: dto.abandonedCalls,
    avgWaitSeconds: dto.avgWaitDuration,
    avgTalkSeconds: dto.avgTalkDuration,
    callsWaiting: dto.waitingCalls,
  };
}
