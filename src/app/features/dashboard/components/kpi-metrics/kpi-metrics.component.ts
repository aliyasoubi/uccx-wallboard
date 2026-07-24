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
// "Calls in queue" is kept here too (previously on service-metrics-panel)
// since there's no other required module it obviously belongs to and this
// panel is the closest fit.
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

  readonly fcrSeverity = computed(() =>
    getInverseSeverity(this.serviceMetrics()?.fcrPercent ?? 100, this.appConfig.config().thresholds.fcrPercent),
  );

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
