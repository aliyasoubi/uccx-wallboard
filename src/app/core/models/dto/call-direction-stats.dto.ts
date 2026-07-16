// PROVISIONAL — inferred from the Inbound/Outbound Calls panels.
// Confirmed with stakeholder: identical top/lowest-agent values across
// Inbound and Outbound are real, not a data bug.
export interface CallDirectionStatsDto {
  topAgentCalls: number;
  lowestAgentCalls: number;
  count: number;
}
