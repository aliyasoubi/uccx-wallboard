import { CallStatsDto } from '../models/dto';
import { CallSummary } from '../models/domain';

export function mapCallSummary(dto: CallStatsDto): CallSummary {
  return {
    totalCalls: dto.totalCalls,
    handledCalls: dto.handledCalls,
    abandonedCalls: dto.abandonedCalls,
    avgWaitSeconds: dto.avgWaitDuration,
    avgTalkSeconds: dto.avgTalkDuration,
    callsWaiting: dto.waitingCalls,
  };
}
