import { Agent } from './agent.model';
import { AgentOfMonth } from './agent-of-month.model';
import { AgentStateSummary } from './agent-state-summary.model';
import { CallDirectionStats } from './call-direction-stats.model';
import { CallSummary } from './call-summary.model';
import { Queue } from './queue.model';
import { ServiceMetrics } from './service-metrics.model';
import { TotalCallSummary } from './total-call-summary.model';

// The single shape the store consumes, regardless of how many source
// requests it took to build it (that's the DataSource/BFF's job to assemble).
export interface DashboardSnapshot {
  callSummary: CallSummary;
  serviceMetrics: ServiceMetrics;
  agentStateSummary: AgentStateSummary; // org-wide totals, from AgentStateStats.json
  agents: Agent[];
  queues: Queue[];
  agentsOfMonth: AgentOfMonth[];
  inboundStats: CallDirectionStats;
  outboundStats: CallDirectionStats;
  totalCallSummary: TotalCallSummary;
  fetchedAt: string; // ISO timestamp
}
