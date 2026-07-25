import { AgentDto, AgentStateDto } from '../models/dto';
import { Agent, AgentStatus } from '../models/domain';

const STATUS_MAP: Record<AgentStateDto['state'], AgentStatus> = {
  "Ready": AgentStatus.Ready,
  "Talking": AgentStatus.Talking,
  "Not Ready": AgentStatus.NotReady,
};

export function mapAgent(dto: AgentDto): Agent {
  return {
    id: dto.id,
    name: dto.name,
    status: STATUS_MAP[dto.state.state],
    statusDurationSeconds: dto.state.duration,
    reason: dto.state.reason ? dto.state.reason : null,
    inboundCalls: dto.inboundCallStats.totalCalls,
    outboundCalls: dto.outboundCallStats.totalCalls,
  };
}

export function mapAgents(dtos: AgentDto[]): Agent[] {
  return dtos.map(mapAgent);
}
