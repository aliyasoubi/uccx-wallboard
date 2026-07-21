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
  /** Optional Tabler icon class (e.g. 'ti-phone-incoming'). Omitted tiles render exactly as before — this is additive, not a breaking change to existing call sites. */
  readonly icon = input<string>('');
  /** Optional CSS color (var(...) or any valid color) for the icon. Defaults to the shared accent token — never a one-off hardcoded hex at the call site. */
  readonly iconColorVar = input<string>('var(--color-status-accent)');

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
