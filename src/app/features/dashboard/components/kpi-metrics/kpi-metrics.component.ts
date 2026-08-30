import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CallSummary, ServiceMetrics } from '../../../../core/models/domain';
import {
  getInverseSeverity,
  getSeverity,
} from '../../../../core/policies/status-thresholds.policy';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';
import { MetricTileComponent } from '../../../../shared/components';

// Module 9, "KPI Metrics Displays": FCR, AWD (Average Wait Duration), AHT
// (Average Handle Time). FCR is provisional — see
// CustomerServiceMetricsDto for the "mocked, unconfirmed field" caveat.
//
// "Calls in queue" is deliberately hidden (product decision, see
// CHANGELOG). callsWaitingSeverity is left computed so re-enabling it later
// is a one-line template change, not a rebuild of the logic.
@Component({
  selector: 'app-kpi-metrics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricTileComponent, FormatDurationPipe],
  templateUrl: './kpi-metrics.component.html',
  styleUrl: './kpi-metrics.component.scss',
})
export class KpiMetricsComponent {
  private readonly appConfig = inject(AppConfigService);

  readonly summary = input<CallSummary | null>(null);
  readonly serviceMetrics = input<ServiceMetrics | null>(null);

  // Number.isFinite, not just a null check: the template renders
  // `fcrPercent + '%'` directly (no toFixed to throw), so a missing/malformed
  // reading used to slip through as the literal string "NaN%" instead of
  // falling back to "—" — the same failure mode SlaGaugeComponent.hasData
  // and CustomerSatisfactionGaugeComponent.hasData already guard against.
  readonly hasFcrData = computed(() => Number.isFinite(this.serviceMetrics()?.fcrPercent));

  readonly fcrSeverity = computed(() => {
    if (!this.hasFcrData()) return 'normal' as const;
    return getInverseSeverity(
      this.serviceMetrics()!.fcrPercent,
      this.appConfig.config().thresholds.fcrPercent,
    );
  });

  readonly awdSeverity = computed(() =>
    getSeverity(
      this.summary()?.avgWaitSeconds ?? 0,
      this.appConfig.config().thresholds.avgWaitSeconds,
    ),
  );

  readonly ahtSeverity = computed(() =>
    getSeverity(
      this.summary()?.avgTalkSeconds ?? 0,
      this.appConfig.config().thresholds.avgTalkSeconds,
    ),
  );

  readonly callsWaitingSeverity = computed(() =>
    getSeverity(this.summary()?.callsWaiting ?? 0, this.appConfig.config().thresholds.callsWaiting),
  );
}
