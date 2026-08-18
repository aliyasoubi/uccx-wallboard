import { AgentDto, AgentStateDto } from '../models/dto';
import { Agent, AgentStatus } from '../models/domain';

const STATUS_MAP: Record<AgentStateDto['state'], AgentStatus> = {
  "Ready": AgentStatus.Ready,
  "Talking": AgentStatus.Talking,
  "Not Ready": AgentStatus.NotReady,
};

// AgentStateDto['state'] is typed as the closed union 'Ready' | 'Talking' |
// 'Not Ready', but that's a compile-time promise about our own code, not a
// runtime guarantee about what the BFF actually sends. UCCX reports several
// other states (Reserved, Work, Logout, ...) that this board doesn't have a
// dedicated bucket for; if one of those — or any unrecognized string — ever
// arrives, STATUS_MAP[...] silently returns undefined, and every consumer
// downstream (AGENT_STATUS_VISUALS lookups, severity checks) expects a real
// AgentStatus and breaks. Falling back to NotReady keeps that one row
// rendering instead of taking out the whole roster, and stamping the raw
// value into `reason` (when the DTO didn't already supply one) means it's
// visible on the badge instead of silently mislabeled as a generic
// "Not ready" with no indication anything was actually unexpected.
function mapStatus(state: AgentStateDto): { status: AgentStatus; reason: string | null } {
  const mapped = STATUS_MAP[state.state];
  if (mapped !== undefined) {
    return { status: mapped, reason: state.reason ? state.reason : null };
  }
  console.warn(`[agent.mapper] Unrecognized agent state "${state.state}" — falling back to Not Ready`);
  return { status: AgentStatus.NotReady, reason: state.reason ? state.reason : state.state };
}

export function mapAgent(dto: AgentDto): Agent {
  const { status, reason } = mapStatus(dto.state);
  return {
    id: dto.id,
    name: dto.name,
    status,
    statusDurationSeconds: dto.state.duration,
    reason,
    inboundCalls: dto.inboundCallStats.totalCalls,
    outboundCalls: dto.outboundCallStats.totalCalls,
  };
}

export function mapAgents(dtos: AgentDto[]): Agent[] {
  return dtos.map(mapAgent);
}
