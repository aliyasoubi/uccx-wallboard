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

  // Mirrors SlaGaugeComponent.hasData: a missing reading must render as
  // missing (not a fabricated "0.0" in normal styling).
  readonly hasData = computed(() => Number.isFinite(this.metrics()?.csatScore));

  readonly displayValue = computed(() =>
    this.hasData() ? this.metrics()!.csatScore.toFixed(1) : '—',
  );

  // Lower is worse for CSAT, so getInverseSeverity (mirrors slaSeverity).
  readonly csatSeverity = computed(() => {
    if (!this.hasData()) return 'normal' as const;
    return getInverseSeverity(
      this.metrics()!.csatScore,
      this.appConfig.config().thresholds.csatScore,
    );
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
