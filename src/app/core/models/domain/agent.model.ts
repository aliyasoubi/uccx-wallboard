import { AgentStatus } from './agent-status';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  statusDurationSeconds: number;
  reason: string | null;
  // Cumulative calls handled this shift, per direction. Source data already
  // carried these (AgentDto.inboundCallStats/outboundCallStats) but the old
  // mapper dropped them — needed now to power Top Inbound/Outbound Agent.
  inboundCalls: number;
  outboundCalls: number;
}
