import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AgentOfMonth } from '../../../../core/models/domain';

// Module 5, "Agent of the Month" (renamed from the shared
// AgentOfMonthCardComponent and moved into features/dashboard/components —
// it's a dashboard-specific feature panel, not a generic reusable
// primitive like metric-tile/status-badge/meter, so it belongs alongside
// the other dashboard modules per the target folder structure).
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
