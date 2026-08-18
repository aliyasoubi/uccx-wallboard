import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ServiceMetrics } from '../../../../core/models/domain';
import { MeterComponent } from '../../../../shared/components';
import { getInverseSeverity } from '../../../../core/policies/status-thresholds.policy';
import { AppConfigService } from '../../../../core/config/app-config.service';

// Module 8, "Customer Satisfaction" gauge. Split out of the old
// ServiceMetricsPanelComponent alongside SlaGaugeComponent — see that
// component's header comment for why.
@Component({
  selector: 'app-customer-satisfaction-gauge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeterComponent],
  templateUrl: './customer-satisfaction-gauge.component.html',
  styleUrl: './customer-satisfaction-gauge.component.scss',
})
export class CustomerSatisfactionGaugeComponent {
  private readonly appConfig = inject(AppConfigService);

  readonly metrics = input<ServiceMetrics | null>(null);

  // CSAT is reported on a fixed 0-5 scale by the source system (see
  // ServiceMetrics domain model) — not a magic number, a documented scale
  // boundary.
  readonly maxScore = 5;

  // Mirrors SlaGaugeComponent.hasData for the same reason documented there:
  // this gauge used to render `(csatScore ?? 0).toFixed(1)`, so a missing
  // reading displayed as "0.0" in normal accent styling — indistinguishable
  // from a genuine, catastrophic CSAT of zero. A missing reading must look
  // missing, not invented.
  readonly hasData = computed(() => Number.isFinite(this.metrics()?.csatScore));

  readonly displayValue = computed(() => (this.hasData() ? this.metrics()!.csatScore.toFixed(1) : '—'));

  // Previously always accent blue regardless of value — a genuinely poor
  // CSAT score looked identical to a great one. Mirrors
  // SlaGaugeComponent.slaSeverity: lower is worse, so getInverseSeverity.
  readonly csatSeverity = computed(() => {
    if (!this.hasData()) return 'normal' as const;
    return getInverseSeverity(this.metrics()!.csatScore, this.appConfig.config().thresholds.csatScore);
  });

  readonly csatColor = computed(() => {
    if (!this.hasData()) return 'var(--color-text-muted)';
    switch (this.csatSeverity()) {
      case 'critical':
        return 'var(--color-status-critical)';
      case 'warning':
        return 'var(--color-status-warning)';
      default:
        return 'var(--color-status-accent)';
    }
  });
}
