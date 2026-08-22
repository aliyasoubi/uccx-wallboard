import { AgentDto, OutboundCallStatsDto } from '../models/dto';
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
    topAgentCalls = Math.max(topAgentCalls, total);
    lowestAgentCalls = Math.min(lowestAgentCalls, total);
  }
  if (lowestAgentCalls == Number.MAX_SAFE_INTEGER) {
    lowestAgentCalls = 0;
  }

  return {
    direction,
    count: count,
    topAgentCalls: topAgentCalls,
    lowestAgentCalls: lowestAgentCalls,
  };
}

/**
 * Outbound stats, with the total taken from the dedicated outbound endpoint
 * (authoritative for call volume, including calls by agents who have since
 * logged out) and the per-agent high/low still derived from the roster.
 *
 * Delegating to mapCallDirectionStats rather than re-deriving is deliberate:
 * an earlier version returned `topAgentCalls: 0` and leaked the
 * `Number.MAX_SAFE_INTEGER` sentinel as `lowestAgentCalls`, dropping the
 * empty-roster normalization that function performs and that
 * call-direction-stats.mapper.spec.ts explicitly guards.
 */
export function mapOutboundCallDirectionStats(
  dto: OutboundCallStatsDto,
  agents: AgentDto[],
): CallDirectionStats {
  return {
    ...mapCallDirectionStats(agents, 'outbound'),
    count: dto.totalCalls,
  };
}
