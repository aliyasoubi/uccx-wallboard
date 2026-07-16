import { AgentStateStatsDto } from './agent-state-stats.dto';

// Matches one entry of CsqStats.json exactly (an array of these).
// Note: "handledlCalls" is the real field name in the source payload (typo preserved
// upstream) — corrected to "handledCalls" only in the domain model, by the mapper.
export interface CsqStatsDto {
  name: string;
  totalCalls: number;
  abandonedCalls: number;
  handledlCalls: number;
  avgWaitDuration: number;
  agentStateStats: AgentStateStatsDto;
  waitingCalls: number;
}
