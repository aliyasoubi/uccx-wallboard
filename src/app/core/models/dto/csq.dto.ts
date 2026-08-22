import { AgentStateCountsDto } from './agent-state-counts.dto';
import { InboundCallStatsDto } from './call-stats.dto';
import { CustomerServiceMetricsDto } from './service-metrics.dto';
import { QueueTimingStatsDto } from './queue-timing-stats.dto';

// Matches one entry of CsqStats.json exactly (an array of these).
// "handledlCalls" is the real field name in the source payload (typo
// preserved upstream) — corrected to "handledCalls" only in the domain
// model, by the mapper.
export interface CsqDto {
  name: string;
  callStats: InboundCallStatsDto;
  agentStateCounts: AgentStateCountsDto;
  serviceMetrics: CustomerServiceMetricsDto;
  timings: QueueTimingStatsDto;
}
