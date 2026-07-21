import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Agent } from '../../../../core/models/domain';
import { StatusBadgeComponent } from '../../../../shared/components';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';

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

  initialOf(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }
}
