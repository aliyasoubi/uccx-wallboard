import { AgentStateDto } from '../models/dto';
import { Agent, AgentStatus } from '../models/domain';

const STATUS_MAP: Record<AgentStateDto['agentState'], AgentStatus> = {
  READY: AgentStatus.Ready,
  TALKING: AgentStatus.Talking,
  NOT_READY: AgentStatus.NotReady,
};

export function mapAgent(dto: AgentStateDto): Agent {
  return {
    id: dto.agentID,
    name: dto.agentName,
    status: STATUS_MAP[dto.agentState],
    statusDurationSeconds: dto.agentStateDuration,
    reason: dto.reason ? dto.reason : null,
  };
}

export function mapAgents(dtos: AgentStateDto[]): Agent[] {
  return dtos.map(mapAgent);
}
