import { AgentStateSummary } from './agent-state-summary.model';

// Field-to-acronym mapping for the Queue Displays module (README §10 open
// item: queue field names weren't confirmed against a real backend, so
// these are documented assumptions — flag with the backend team before
// go-live):
//   CWD = Current Wait Duration  — longest a caller is waiting right now
//   MAD = Max Abandon Duration   — longest a caller waited before abandoning
//   ACT = Average Call Time      — average total handled-call duration
export interface Queue {
  name: string;
  totalCalls: number; // "Inbound" in the Queue Displays module
  handledCalls: number; // typo from CsqStatsDto.handledlCalls corrected here
  abandonedCalls: number; // "Abandons"
  avgWaitSeconds: number;
  callsWaiting: number; // "In Queue"
  agentStates: AgentStateSummary; // agentStates.ready -> "Ready Agents"
  currentWaitSeconds: number; // CWD
  maxAbandonSeconds: number; // MAD
  avgHandleSeconds: number; // ACT
  slaPercent: number; // SLA
}
