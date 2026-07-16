import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Skill } from '../../../../core/models/domain';

@Component({
  selector: 'app-top-skills-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './top-skills-panel.component.html',
  styleUrl: './top-skills-panel.component.scss',
})
export class TopSkillsPanelComponent {
  readonly skills = input<Skill[]>([]);

  trackBySkill(_index: number, skill: Skill): string {
    return skill.agentId + skill.name;
  }
}
