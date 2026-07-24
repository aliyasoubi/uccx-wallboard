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

  // Previously defaulted to MAX_PERCENT (100) when metrics was null, which
  // made slaColor() resolve to "normal" (green) — so on every fresh page
  // load, and for the duration of any real backend outage, the ring showed
  // a green "0%" as if SLA were perfect. hasData() now gates severity so a
  // missing reading renders as neutral, not as a false "all clear".
  readonly hasData = computed(() => this.metrics() !== null);

  readonly slaSeverity = computed(() => {
    const metrics = this.metrics();
    if (!metrics) return 'normal' as const;
    return getInverseSeverity(metrics.slaPercent, this.appConfig.config().thresholds.slaPercent);
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
