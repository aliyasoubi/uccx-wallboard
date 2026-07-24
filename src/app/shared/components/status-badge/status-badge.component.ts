import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AgentStatus } from '../../../core/models/domain';
import { AGENT_STATUS_VISUALS } from '../../status-visuals';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<AgentStatus>();

  // Optional free-text sub-reason (e.g. "Break", "Meeting") — sourced
  // today from Agent.reason, which the mapper already carries but no
  // component previously displayed. Only ever shown for Not Ready: color
  // and background stay tied to the actual status regardless, so an
  // unrecognized or future reason string never invents a color that
  // isn't backed by the severity/status model.
  readonly reason = input<string | null>(null);

  readonly visual = computed(() => {
    const base = AGENT_STATUS_VISUALS[this.status()];
    const reason = this.reason();
    if (this.status() === AgentStatus.NotReady && reason) {
      return { ...base, label: reason };
    }
    return base;
  });
}
