import { AgentStatus } from './agent-status';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  statusDurationSeconds: number;
  reason: string | null;
}
