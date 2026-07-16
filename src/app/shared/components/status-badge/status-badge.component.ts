import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AgentStatus } from '../../../core/models/domain';

interface StatusVisual {
  label: string;
  colorVar: string;
  bgVar: string;
}

// Status meaning is never color-only: label text always accompanies the
// color, satisfying the accessibility requirement from the README.
const STATUS_VISUALS: Record<AgentStatus, StatusVisual> = {
  [AgentStatus.Ready]: {
    label: 'Ready',
    colorVar: 'var(--color-status-normal)',
    bgVar: 'var(--color-status-normal-bg)',
  },
  [AgentStatus.Talking]: {
    label: 'Talking',
    colorVar: 'var(--color-status-accent)',
    bgVar: 'var(--color-status-accent-bg)',
  },
  [AgentStatus.NotReady]: {
    label: 'Not ready',
    colorVar: 'var(--color-status-neutral)',
    bgVar: 'var(--color-surface-2)',
  },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<AgentStatus>();

  readonly visual = computed(() => STATUS_VISUALS[this.status()]);
}
