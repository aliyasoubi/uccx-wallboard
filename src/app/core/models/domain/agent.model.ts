import { AgentStatus } from './agent-status';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  statusDurationSeconds: number;
  reason: string | null;
  // Cumulative calls handled this shift, per direction — powers Top
  // Inbound/Outbound Agent.
  inboundCalls: number;
  outboundCalls: number;
}
