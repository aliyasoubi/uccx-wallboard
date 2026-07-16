// Matches AgentOfMonth.json exactly.
export interface AgentOfMonthDto {
  agentID: string;
  photoUrl: string; // observed empty in sample data — mapper must supply a fallback
}
