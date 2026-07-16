// Matches AgentStates.json exactly. Nothing outside the mapper should import this.
export interface AgentStateDto {
  agentID: string;
  agentName: string;
  agentState: 'READY' | 'TALKING' | 'NOT_READY';
  agentStateDuration: number; // seconds
  reason: string;
}
