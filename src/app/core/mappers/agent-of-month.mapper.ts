import { AgentOfMonthDto } from '../models/dto';
import { Agent, AgentOfMonth } from '../models/domain';

// Cross-references the roster because AgentOfMonthDto only carries an ID —
// the display name lives on the agent record, not duplicated in this DTO.
export function mapAgentOfMonth(dto: AgentOfMonthDto, agents: Agent[]): AgentOfMonth {
  const matched = agents.find((a) => a.id === dto.agentID);
  return {
    agentId: dto.agentID,
    name: matched?.name ?? null,
    photoUrl: dto.photoUrl ? dto.photoUrl : null,
  };
}
