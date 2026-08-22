import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AgentOfMonth } from '../../../../core/models/domain';

// Module 5, "Agent of the Month".
@Component({
  selector: 'app-agent-of-month',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-of-month.component.html',
  styleUrl: './agent-of-month.component.scss',
})
export class AgentOfMonthComponent {
  readonly agents = input<AgentOfMonth[] | null>(null);

  readonly fallbackImgs = computed(() => this.agents()?.map((agent) => {
    const name = agent.name;
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }))
}
