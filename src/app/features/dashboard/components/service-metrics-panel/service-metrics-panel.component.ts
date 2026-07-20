import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ServiceMetrics } from '../../../../core/models/domain';
import {
  getInverseSeverity,
  getSeverity,
  STATUS_THRESHOLDS,
} from '../../../../core/policies/status-thresholds.policy';
import { MeterComponent, MetricTileComponent } from '../../../../shared/components';

@Component({
  selector: 'app-service-metrics-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeterComponent, MetricTileComponent],
  templateUrl: './service-metrics-panel.component.html',
  styleUrl: './service-metrics-panel.component.scss',
})
export class ServiceMetricsPanelComponent {
  readonly metrics = input<ServiceMetrics | null>(null);
  readonly callsWaiting = input<number>(0);

  readonly slaSeverity = computed(() =>
    getInverseSeverity(this.metrics()?.slaPercent ?? 100, STATUS_THRESHOLDS.slaPercent),
  );

  readonly slaColor = computed(() => {
    switch (this.slaSeverity()) {
      case 'critical':
        return 'var(--color-status-critical)';
      case 'warning':
        return 'var(--color-status-warning)';
      default:
        return 'var(--color-status-normal)';
    }
  });

  readonly callsWaitingSeverity = computed(() =>
    getSeverity(this.callsWaiting(), STATUS_THRESHOLDS.callsWaiting),
  );
}
