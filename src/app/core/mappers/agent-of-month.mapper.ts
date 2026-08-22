import { AgentOfMonthDto } from '../models/dto';
import { AgentOfMonth } from '../models/domain';

// Cross-references the roster because AgentOfMonthDto only carries an ID —
// the display name lives on the agent record, not duplicated in this DTO.
export function mapAgentsOfMonth(dtos: AgentOfMonthDto[]): AgentOfMonth[] {
  return dtos.map((d) => {
    return {
      agentId: d.agentID,
      name: d.name,
      photoUrl: d.photoUrl
    }
  });
}
