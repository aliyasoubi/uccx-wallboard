import { AgentDto } from '../models/dto';
import { CallDirectionStats } from '../models/domain';

export function mapCallDirectionStats(
  dtos: AgentDto[],
  direction: 'inbound' | 'outbound',
): CallDirectionStats {
  let count = 0;
  let topAgentCalls = 0;
  let lowestAgentCalls = Number.MAX_SAFE_INTEGER;

  for (const a of dtos) {
    let total = 0;
    if (direction == 'inbound') {
      total = a.inboundCallStats.totalCalls;
    } else {
      total = a.outboundCallStats.totalCalls;
    }

    count += total;
    topAgentCalls = Math.max(topAgentCalls, total)
    lowestAgentCalls = Math.min(lowestAgentCalls, total)
  }
  if (lowestAgentCalls == Number.MAX_SAFE_INTEGER) {
    lowestAgentCalls = 0
  }


  return {
    direction,
    count: count,
    topAgentCalls: topAgentCalls,
    lowestAgentCalls: lowestAgentCalls,
  };
}
