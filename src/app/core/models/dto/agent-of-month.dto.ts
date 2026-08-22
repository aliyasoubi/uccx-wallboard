// Matches AgentOfMonth.json exactly.
export interface AgentOfMonthDto {
  agentID: string;
  name: string;
  photoUrl: string; // observed empty in sample data — mapper must supply a fallback
}
