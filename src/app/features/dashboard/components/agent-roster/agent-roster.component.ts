import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Agent } from '../../../../core/models/domain';
import { StatusBadgeComponent } from '../../../../shared/components';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';

@Component({
  selector: 'app-agent-roster',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, FormatDurationPipe],
  templateUrl: './agent-roster.component.html',
  styleUrl: './agent-roster.component.scss',
})
export class AgentRosterComponent {
  readonly agents = input<Agent[]>([]);

  trackByAgentId(_index: number, agent: Agent): string {
    return agent.id;
  }
}
