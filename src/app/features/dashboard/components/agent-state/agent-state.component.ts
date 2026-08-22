import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AgentStateSummary } from '../../../../core/models/domain';
import { AgentStateDonutComponent } from '../../../../shared/components';

// Module 6, "Agent State". AgentStateDonutComponent is the generic,
// reusable shared primitive (no HTTP/store knowledge); this is the
// dashboard-level wrapper (title + layout) around it.
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
