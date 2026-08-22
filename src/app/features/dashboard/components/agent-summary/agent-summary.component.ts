import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Agent } from '../../../../core/models/domain';
import { StatusBadgeComponent } from '../../../../shared/components';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';
import { AGENT_STATUS_VISUALS, StatusVisual } from '../../../../shared/status-visuals';

// Module 4, "Agent Summary" (renamed from AgentRosterComponent).
@Component({
  selector: 'app-agent-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, FormatDurationPipe],
  templateUrl: './agent-summary.component.html',
  styleUrl: './agent-summary.component.scss',
})
export class AgentSummaryComponent {
  readonly agents = input<Agent[]>([]);

  // Two letters read more distinctly at a glance than one. Guards against
  // blank/single-word names so a bad record can't throw and take down the
  // rest of the list.
  initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  // Avatar tint reuses the exact same status->color mapping the badge
  // uses (single source of truth in shared/status-visuals.ts), so an
  // agent's avatar and their status badge always agree with each other.
  visualOf(agent: Agent): StatusVisual {
    return AGENT_STATUS_VISUALS[agent.status];
  }

  totalCalls(agent: Agent): number {
    return agent.inboundCalls + agent.outboundCalls;
  }
}
