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
  readonly agent = input<AgentOfMonth | null>(null);

  // Defined fallback for the empty photoUrl observed in the sample data,
  // rather than letting an <img> render broken.
  readonly initials = computed(() => {
    const name = this.agent()?.name;
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });
}
