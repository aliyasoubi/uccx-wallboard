import { CsqStatsDto } from '../models/dto';
import { Queue } from '../models/domain';

export function mapQueue(dto: CsqStatsDto): Queue {
  return {
    name: dto.name,
    totalCalls: dto.totalCalls,
    // NOTE: source field is "handledlCalls" (typo). Corrected on the way in
    // so nothing downstream of this mapper ever has to know about it.
    handledCalls: dto.handledlCalls,
    abandonedCalls: dto.abandonedCalls,
    avgWaitSeconds: dto.avgWaitDuration,
    callsWaiting: dto.waitingCalls,
    agentStates: {
      total: dto.agentStateStats.total,
      ready: dto.agentStateStats.ready,
      talking: dto.agentStateStats.talking,
      notReady: dto.agentStateStats.notReady,
    },
  };
}

export function mapQueues(dtos: CsqStatsDto[]): Queue[] {
  return dtos.map(mapQueue);
}
