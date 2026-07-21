import { AgentStateCountsDto } from './agent-state-counts.dto';
import { CallStatsDto } from './call-stats.dto';
import { CustomerServiceMetricsDto } from './service-metrics.dto';
import { QueueTimingStatsDto } from './queue-timing-stats.dto';

// Matches one entry of CsqStats.json exactly (an array of these).
// Note: "handledlCalls" is the real field name in the source payload (typo preserved
// upstream) — corrected to "handledCalls" only in the domain model, by the mapper.
//
// `serviceMetrics` was already declared here but CsqStats.json didn't
// actually carry it and queue.mapper.ts never read it — exactly the kind of
// silent contract drift the mapper layer exists to catch. Now mapped through
// (see queue.mapper.ts) and the fixture has been corrected to include it.
export interface CsqDto {
  name: string;
  callStats: CallStatsDto;
  agentStateCounts: AgentStateCountsDto;
  serviceMetrics: CustomerServiceMetricsDto;
  timings: QueueTimingStatsDto;
}
