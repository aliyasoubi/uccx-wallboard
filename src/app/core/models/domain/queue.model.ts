import { AgentStateSummary } from './agent-state-summary.model';

export interface Queue {
  name: string;
  totalCalls: number;
  handledCalls: number; // typo from CsqStatsDto.handledlCalls corrected here
  abandonedCalls: number;
  avgWaitSeconds: number;
  callsWaiting: number;
  agentStates: AgentStateSummary;
}
