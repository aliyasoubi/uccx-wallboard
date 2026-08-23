import { AgentDto, InboundCallStatsDto, OutboundCallStatsDto } from '../models/dto';
import { CallDirectionStats } from '../models/domain';

/**
 * Roster-derived stats for one direction. Only the per-agent high/low are
 * used from here in production; `count`/`totalTalkSeconds` are overwritten
 * by the direction-level endpoint (see the two functions below), because a
 * roster sum misses calls handled by agents who have since logged out.
 */
export function mapCallDirectionStats(
  dtos: AgentDto[],
  direction: 'inbound' | 'outbound',
): CallDirectionStats {
  let count = 0;
  let totalTalkSeconds = 0;
  let topAgentCalls = 0;
  let lowestAgentCalls = Number.MAX_SAFE_INTEGER;

  for (const a of dtos) {
    const stats = direction === 'inbound' ? a.inboundCallStats : a.outboundCallStats;
    const total = stats.totalCalls;

    count += total;
    totalTalkSeconds += stats.totalTalkDuration;
    topAgentCalls = Math.max(topAgentCalls, total);
    lowestAgentCalls = Math.min(lowestAgentCalls, total);
  }
  if (lowestAgentCalls === Number.MAX_SAFE_INTEGER) {
    lowestAgentCalls = 0;
  }

  return {
    direction,
    count,
    totalTalkSeconds,
    topAgentCalls,
    lowestAgentCalls,
  };
}

/**
 * Inbound stats: volume and talk time from the dedicated inbound endpoint
 * (authoritative — it includes calls by agents who have since logged out),
 * per-agent high/low still from the roster.
 *
 * Both directions now follow this same shape. Previously inbound was summed
 * from the roster while outbound came from its endpoint, so the two were not
 * comparable with each other.
 */
export function mapInboundCallDirectionStats(
  dto: InboundCallStatsDto,
  agents: AgentDto[],
): CallDirectionStats {
  return {
    ...mapCallDirectionStats(agents, 'inbound'),
    count: dto.totalCalls,
    totalTalkSeconds: dto.totalTalkDuration,
  };
}

/**
 * Outbound counterpart of mapInboundCallDirectionStats.
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
    totalTalkSeconds: dto.totalTalkDuration,
  };
}
