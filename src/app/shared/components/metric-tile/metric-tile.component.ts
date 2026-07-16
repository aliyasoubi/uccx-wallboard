import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Severity } from '../../../core/models/domain';

@Component({
  selector: 'app-metric-tile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metric-tile.component.html',
  styleUrl: './metric-tile.component.scss',
})
export class MetricTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  /** 'normal' | 'warning' | 'critical' — drives color from the shared token set, nothing hardcoded per-call site. */
  readonly severity = input<Severity>('normal');
  readonly size = input<'md' | 'lg'>('md');

  readonly colorVar = computed(() => {
    switch (this.severity()) {
      case 'critical':
        return 'var(--color-status-critical)';
      case 'warning':
        return 'var(--color-status-warning)';
      default:
        return 'var(--color-text-primary)';
    }
  });

  readonly bgVar = computed(() => {
    switch (this.severity()) {
      case 'critical':
        return 'var(--color-status-critical-bg)';
      case 'warning':
        return 'var(--color-status-warning-bg)';
      default:
        return 'var(--color-surface-1)';
    }
  });
}
