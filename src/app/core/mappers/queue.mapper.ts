import { CsqDto } from '../models/dto';
import { Queue } from '../models/domain';

export function mapQueue(dto: CsqDto): Queue {
  return {
    name: dto.name,
    totalCalls: dto.callStats.totalCalls,
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
    // dto.serviceMetrics was declared on CsqDto but never actually read here —
    // the Queue Displays "SLA" field now closes that gap.
    slaPercent: dto.serviceMetrics.sla,
    currentWaitSeconds: dto.timings.currentWaitDuration,
    maxWaitSeconds: dto.timings.maxWaitDuration,
    avgTalkSeconds: dto.timings.avgHandleDuration,
  };
}

export function mapQueues(dtos: CsqDto[]): Queue[] {
  return dtos.map(mapQueue);
}
