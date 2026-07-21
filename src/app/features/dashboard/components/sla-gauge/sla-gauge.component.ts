import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ServiceMetrics } from '../../../../core/models/domain';
import { getInverseSeverity, STATUS_THRESHOLDS } from '../../../../core/policies/status-thresholds.policy';
import { MeterComponent } from '../../../../shared/components';

// Module 7, "SLA Gauge". Split out of the old ServiceMetricsPanelComponent,
// which bundled SLA + CSAT + calls-waiting into one panel — the spec calls
// SLA and CSAT out as two distinct required modules, so each now owns its
// own single-responsibility component instead of one panel doing three
// jobs.
@Component({
  selector: 'app-sla-gauge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeterComponent],
  templateUrl: './sla-gauge.component.html',
  styleUrl: './sla-gauge.component.scss',
})
export class SlaGaugeComponent {
  readonly metrics = input<ServiceMetrics | null>(null);

  private static readonly MAX_PERCENT = 100;

  readonly slaSeverity = computed(() =>
    getInverseSeverity(this.metrics()?.slaPercent ?? SlaGaugeComponent.MAX_PERCENT, STATUS_THRESHOLDS.slaPercent),
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

  readonly maxPercent = SlaGaugeComponent.MAX_PERCENT;
}
