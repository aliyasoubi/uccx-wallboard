import { CsqDto } from '../models/dto';
import { Queue } from '../models/domain';

export function mapQueue(dto: CsqDto): Queue {
  return {
    name: dto.name,
    totalCalls: dto.callStats.totalCalls,
    // NOTE: source field is "handledlCalls" (typo). Corrected on the way in
    // so nothing downstream of this mapper ever has to know about it.
    handledCalls: dto.callStats.handledCalls,
    abandonedCalls: dto.callStats.abandonedCalls,
    avgWaitSeconds: dto.callStats.avgWaitDuration,
    callsWaiting: dto.callStats.waitingCalls,
    agentStates: {
      total: dto.agentStateCounts.total,
      ready: dto.agentStateCounts.ready,
      talking: dto.agentStateCounts.talking,
      notReady: dto.agentStateCounts.notReady,
    },
  };
}

export function mapQueues(dtos: CsqDto[]): Queue[] {
  return dtos.map(mapQueue);
}
