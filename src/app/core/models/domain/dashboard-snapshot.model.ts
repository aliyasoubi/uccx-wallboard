import { Agent } from './agent.model';
import { AgentOfMonth } from './agent-of-month.model';
import { AgentStateSummary } from './agent-state-summary.model';
import { CallDirectionStats } from './call-direction-stats.model';
import { CallSummary } from './call-summary.model';
import { Queue } from './queue.model';
import { ServiceMetrics } from './service-metrics.model';

// The single shape the store consumes, regardless of how many source
// requests it took to build it (that's the DataSource/BFF's job to assemble).
//
// Every field but fetchedAt is nullable: BffClientService fetches each
// resource independently and a single failing endpoint no longer fails the
// whole poll (see fetchSnapshot()) — null on a field means "this resource
// failed to load THIS tick", and DashboardStoreService's job is to leave
// that one signal at its last-known-good value rather than blanking it.
// null is never "empty roster"/"zero calls"; a real empty result is `[]`,
// not `null`.
export interface DashboardSnapshot {
  callSummary: CallSummary | null;
  serviceMetrics: ServiceMetrics | null;
  agentStateSummary: AgentStateSummary | null; // org-wide totals, from AgentStateStats.json
  agents: Agent[] | null;
  queues: Queue[] | null;
  agentOfMonth: AgentOfMonth | null;
  inboundStats: CallDirectionStats | null;
  outboundStats: CallDirectionStats | null;
  fetchedAt: string; // ISO timestamp — always set, even on a partial poll
}
