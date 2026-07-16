import { SkillStatDto } from '../models/dto';
import { Skill } from '../models/domain';

export function mapSkill(dto: SkillStatDto): Skill {
  return {
    agentId: dto.agentId,
    name: dto.skillsName,
    count: dto.skillsCount,
  };
}

export function mapSkills(dtos: SkillStatDto[]): Skill[] {
  return dtos.map(mapSkill);
}
