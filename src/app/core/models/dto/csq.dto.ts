import { AgentStateCountsDto } from './agent-state-counts.dto';
import { CallStatsDto } from './call-stats.dto';
import { CustomerServiceMetricsDto } from './service-metrics.dto';

// Matches one entry of CsqStats.json exactly (an array of these).
// Note: "handledlCalls" is the real field name in the source payload (typo preserved
// upstream) — corrected to "handledCalls" only in the domain model, by the mapper.
export interface CsqDto {
  name: string;
  callStats: CallStatsDto;
  agentStateCounts: AgentStateCountsDto;
  serviceMetrics: CustomerServiceMetricsDto;
}
