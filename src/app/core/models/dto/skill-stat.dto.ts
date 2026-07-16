// PROVISIONAL — inferred from the "Top Skills" table in the screenshot.
// No real API contract confirmed for this yet; verify field names with the
// backend before wiring this to a live endpoint.
export interface SkillStatDto {
  agentId: string;
  skillsName: string;
  skillsCount: number;
}
