import { AgentOfMonthDto } from '../models/dto';
import { AgentOfMonth } from '../models/domain';

// AgentOfMonthDto now carries name directly, so no roster cross-reference
// is needed here (unlike the single-winner version this replaced).
export function mapAgentsOfMonth(dtos: AgentOfMonthDto[]): AgentOfMonth[] {
  return dtos.map((d) => ({
    agentId: d.agentID,
    name: d.name,
    // null (not ''), matching the AgentOfMonth domain model's contract so
    // the UI can render a defined fallback.
    photoUrl: d.photoUrl ? d.photoUrl : null,
  }));
}
