import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AgentOfMonth } from '../../../core/models/domain';

@Component({
  selector: 'app-agent-of-month-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-of-month-card.component.html',
  styleUrl: './agent-of-month-card.component.scss',
})
export class AgentOfMonthCardComponent {
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
