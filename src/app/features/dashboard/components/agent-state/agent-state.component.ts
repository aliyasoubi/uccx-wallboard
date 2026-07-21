import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AgentStateSummary } from '../../../../core/models/domain';
import { AgentStateDonutComponent } from '../../../../shared/components';

// Module 6, "Agent State". The donut visualization itself stays a generic,
// reusable shared primitive (AgentStateDonutComponent, no HTTP/store
// knowledge) — this component is the dashboard-level wrapper (title +
// layout) that used to be written directly inline in dashboard.component.html.
// Extracting it gives Agent State its own single-responsibility module
// instead of markup embedded in the shell, consistent with every other
// panel on the board.
@Component({
  selector: 'app-agent-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgentStateDonutComponent],
  templateUrl: './agent-state.component.html',
  styleUrl: './agent-state.component.scss',
})
export class AgentStateComponent {
  readonly summary = input<AgentStateSummary | null>(null);
}
