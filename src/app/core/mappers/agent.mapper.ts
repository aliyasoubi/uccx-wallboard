import { AgentDto, AgentStateDto } from '../models/dto';
import { Agent, AgentStatus } from '../models/domain';

const STATUS_MAP: Record<AgentStateDto['state'], AgentStatus> = {
  Ready: AgentStatus.Ready,
  Talking: AgentStatus.Talking,
  'Not Ready': AgentStatus.NotReady,
};

// AgentStateDto['state'] is a closed TS union, but that's a compile-time
// promise, not a runtime guarantee — UCCX reports other states (Reserved,
// Work, Logout, ...) this board has no bucket for. An unrecognized string
// would otherwise make STATUS_MAP[...] return undefined and break every
// downstream consumer expecting a real AgentStatus. Falling back to
// NotReady keeps that one row rendering; stamping the raw value into
// `reason` keeps it visible on the badge instead of silently mislabeled.
function mapStatus(state: AgentStateDto): { status: AgentStatus; reason: string | null } {
  const mapped = STATUS_MAP[state.state];
  if (mapped !== undefined) {
    return { status: mapped, reason: state.reason ? state.reason : null };
  }
  console.warn(
    `[agent.mapper] Unrecognized agent state "${state.state}" — falling back to Not Ready`,
  );
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
