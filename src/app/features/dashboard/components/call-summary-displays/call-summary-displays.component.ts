import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { getRatioSeverity } from '../../../../core/policies/status-thresholds.policy';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { CallDirectionStats, CallSummary } from '../../../../core/models/domain';
import { MetricTileComponent } from '../../../../shared/components';

// Module 1, "Call Summary Displays": Abandoned / Incoming / Outbound / Answered.
// Renamed and refocused from the old CallsSummaryPanelComponent, which mixed
// in avg-wait/avg-talk — those now live in KpiMetricsComponent as AWD/AHT,
// matching the module boundaries in the spec instead of one catch-all panel.
//
// Incoming/Outbound counts come from the agent-roster-derived direction
// stats (same source as the Top Inbound/Outbound Agent widgets) rather than
// the org-wide CallStats.json total, so all "by direction" numbers on the
// board are self-consistent with one another.
@Component({
  selector: 'app-call-summary-displays',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricTileComponent],
  templateUrl: './call-summary-displays.component.html',
  styleUrl: './call-summary-displays.component.scss',
})
export class CallSummaryDisplaysComponent {
  private readonly appConfig = inject(AppConfigService);

  readonly summary = input<CallSummary | null>(null);
  readonly inboundStats = input<CallDirectionStats | null>(null);
  readonly outboundStats = input<CallDirectionStats | null>(null);

  readonly abandonedSeverity = computed(() => {
    const s = this.summary();
    if (!s) return 'normal' as const;
    return getRatioSeverity(s.abandonedCalls, s.totalCalls, this.appConfig.config().thresholds.abandonedRatio);
  });
}
