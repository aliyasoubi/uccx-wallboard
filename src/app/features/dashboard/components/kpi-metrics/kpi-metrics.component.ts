import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CallSummary, ServiceMetrics } from '../../../../core/models/domain';
import { getInverseSeverity, getSeverity } from '../../../../core/policies/status-thresholds.policy';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';
import { MetricTileComponent } from '../../../../shared/components';

// Module 9, "KPI Metrics Displays": FCR, AWD (Average Wait Duration), AHT
// (Average Handle Time). AWD/AHT are the avgWaitSeconds/avgTalkSeconds
// values that used to live on the old calls-summary panel — relocated here
// to match the KPI grouping in the spec, not dropped. FCR is new; see
// CustomerServiceMetricsDto for the "mocked, unconfirmed field" caveat.
//
// "Calls in queue" (callsWaitingSeverity below, tile in the template) is
// DELIBERATELY HIDDEN as of 2026-07-24 — not needed for now, per explicit
// product decision (see CHANGELOG Pass 8). This is not the same as the
// earlier accidental-dead-code bug fixed in Pass 5, where the tile was
// commented out despite the component's own doc comment and spec both
// still expecting it — that was a regression; this is an intentional,
// documented, easily-reversible toggle. callsWaitingSeverity is left
// computed (cheap, harmless) so re-enabling later is a one-line template
// change, not a rebuild of the logic.
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

  readonly hasFcrData = computed(() => this.serviceMetrics() !== null);

  readonly fcrSeverity = computed(() => {
    const serviceMetrics = this.serviceMetrics();
    if (!serviceMetrics) return 'normal' as const;
    return getInverseSeverity(serviceMetrics.fcrPercent, this.appConfig.config().thresholds.fcrPercent);
  });

  readonly awdSeverity = computed(() =>
    getSeverity(this.summary()?.avgWaitSeconds ?? 0, this.appConfig.config().thresholds.avgWaitSeconds),
  );

  readonly ahtSeverity = computed(() =>
    getSeverity(this.summary()?.avgTalkSeconds ?? 0, this.appConfig.config().thresholds.avgTalkSeconds),
  );

  readonly callsWaitingSeverity = computed(() =>
    getSeverity(this.summary()?.callsWaiting ?? 0, this.appConfig.config().thresholds.callsWaiting),
  );
}
