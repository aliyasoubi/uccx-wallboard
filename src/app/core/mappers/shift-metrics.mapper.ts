import { AgentDto } from '../models/dto';
import { ShiftMetrics } from '../models/domain';

export function mapShiftMetrics(dtos: AgentDto[]): ShiftMetrics {
  let sumHandleTime = 0;
  let totalTalkSeconds = 0;
  for (const a of dtos) {
    const s = a.inboundCallStats;

    totalTalkSeconds += s.totalTalkDuration;
    sumHandleTime += s.avgTalkDuration + s.avgHoldDuration + s.avgWorkDuration;
  }

  let avgHandleSeconds = 0;
  if (dtos.length > 0) {
    avgHandleSeconds = sumHandleTime / dtos.length
  }


  return {
    avgHandleSeconds: avgHandleSeconds,
    totalTalkSeconds: totalTalkSeconds,
  };
}
