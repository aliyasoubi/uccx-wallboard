import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CallSummary, ServiceMetrics } from '../../../../core/models/domain';
import {
  getInverseSeverity,
  getSeverity,
  STATUS_THRESHOLDS,
} from '../../../../core/policies/status-thresholds.policy';
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
  readonly summary = input<CallSummary | null>(null);
  readonly serviceMetrics = input<ServiceMetrics | null>(null);

  readonly fcrSeverity = computed(() =>
    getInverseSeverity(this.serviceMetrics()?.fcrPercent ?? 100, STATUS_THRESHOLDS.fcrPercent),
  );

  readonly awdSeverity = computed(() =>
    getSeverity(this.summary()?.avgWaitSeconds ?? 0, STATUS_THRESHOLDS.avgWaitSeconds),
  );

  readonly ahtSeverity = computed(() =>
    getSeverity(this.summary()?.avgTalkSeconds ?? 0, STATUS_THRESHOLDS.avgTalkSeconds),
  );

  readonly callsWaitingSeverity = computed(() =>
    getSeverity(this.summary()?.callsWaiting ?? 0, STATUS_THRESHOLDS.callsWaiting),
  );
}
