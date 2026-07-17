import { AgentDto, AgentStateDto } from '../models/dto';
import { Agent, AgentStatus } from '../models/domain';

const STATUS_MAP: Record<AgentStateDto['state'], AgentStatus> = {
  READY: AgentStatus.Ready,
  TALKING: AgentStatus.Talking,
  NOT_READY: AgentStatus.NotReady,
};

export function mapAgent(dto: AgentDto): Agent {
  return {
    id: dto.id,
    name: dto.name,
    status: STATUS_MAP[dto.state.state],
    statusDurationSeconds: dto.state.duration,
    reason: dto.state.reason ? dto.state.reason : null,
  };
}

export function mapAgents(dtos: AgentDto[]): Agent[] {
  return dtos.map(mapAgent);
}
