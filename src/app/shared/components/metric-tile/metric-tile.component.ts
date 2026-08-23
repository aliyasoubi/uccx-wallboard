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
  /**
   * Value type size. Use 'sm' for values that are long strings rather than
   * short numbers (h:mm:ss durations) — at 'md' an 8-character duration
   * overflows its tile. The call site knows what it is rendering; CSS can
   * only see the tile's width, not the content's length.
   */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Optional Tabler icon class (e.g. 'ti-phone-incoming'). Omitted tiles render exactly as before. */
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

  // surface-2, not surface-1: every metric tile now renders inside a
  // surface-1 group card (Calls Summary / KPI Metrics), so the tile must
  // sit one elevation step above its card to read as a cell instead of
  // vanishing into it.
  readonly bgVar = computed(() => {
    switch (this.severity()) {
      case 'critical':
        return 'var(--color-status-critical-bg)';
      case 'warning':
        return 'var(--color-status-warning-bg)';
      default:
        return 'var(--color-surface-2)';
    }
  });
}
