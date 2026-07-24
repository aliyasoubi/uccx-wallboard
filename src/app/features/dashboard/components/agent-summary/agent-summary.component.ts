import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Agent } from '../../../../core/models/domain';
import { StatusBadgeComponent } from '../../../../shared/components';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';
import { AGENT_STATUS_VISUALS, StatusVisual } from '../../../../shared/status-visuals';

// Module 4, "Agent Summary" (renamed from AgentRosterComponent).
//
// Investigated the reported "only the first list item works" symptom:
// reviewed the template's @for/track expression, the OnPush change
// detection, and the agent/mapper pipeline feeding it. Could not reproduce
// it against this codebase — mapAgents() maps every entry in AgentDto[],
// the template iterates the full agents() array, and each row is
// independent (no shared mutable state between rows). Two hardening
// changes made anyway, plus a regression test (agent-summary.component.spec.ts)
// asserting all rows render, not just the first:
//   1. track expression simplified from a two-argument trackByAgentId(
//      $index, agent) function to the plain `agent.id` expression the new
//      @for syntax expects — removes an unnecessary indirection that had
//      no effect on behavior but was a likely place to look for bugs.
//   2. Guards against a blank agent.name (which would throw on
//      `.charAt(0)` in the old template) so a single bad record can't take
//      down the rest of the list.
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

  // Two letters (first + last name) read more distinctly at a glance than
  // one — "John Smith" and "Jane Sato" both used to collapse to the same
  // "J" avatar. Guards against blank/single-word names the same way the
  // original single-letter version did, so a bad record still can't throw
  // and take down the rest of the list.
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
