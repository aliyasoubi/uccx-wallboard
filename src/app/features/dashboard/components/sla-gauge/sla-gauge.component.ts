import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ServiceMetrics } from '../../../../core/models/domain';
import { getInverseSeverity } from '../../../../core/policies/status-thresholds.policy';
import { AppConfigService } from '../../../../core/config/app-config.service';
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
  private readonly appConfig = inject(AppConfigService);

  readonly metrics = input<ServiceMetrics | null>(null);

  private static readonly MAX_PERCENT = 100;

  // Number.isFinite, not just a null check: the template calls
  // slaPercent.toFixed(1), which throws (not renders badly) on a missing or
  // malformed reading, taking the whole panel down. This keeps that case on
  // the "—" path instead of a false "all clear" or a crash.
  readonly hasData = computed(() => Number.isFinite(this.metrics()?.slaPercent));

  readonly slaSeverity = computed(() => {
    if (!this.hasData()) return 'normal' as const;
    return getInverseSeverity(
      this.metrics()!.slaPercent,
      this.appConfig.config().thresholds.slaPercent,
    );
  });

  readonly slaColor = computed(() => {
    if (!this.hasData()) return 'var(--color-text-muted)';
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
