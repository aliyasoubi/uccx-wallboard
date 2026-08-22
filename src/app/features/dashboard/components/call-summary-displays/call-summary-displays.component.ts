import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { getRatioSeverity } from '../../../../core/policies/status-thresholds.policy';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { CallDirectionStats, CallSummary } from '../../../../core/models/domain';
import { MetricTileComponent } from '../../../../shared/components';

// Module 1, "Call Summary Displays": Abandoned / Incoming / Outbound / Answered.
//
// Incoming/Outbound counts come from the same agent-roster-derived direction
// stats as the Top Inbound/Outbound Agent widgets, so all "by direction"
// numbers on the board stay self-consistent with each other.
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
    return getRatioSeverity(
      s.abandonedCalls,
      s.totalCalls,
      this.appConfig.config().thresholds.abandonedRatio,
    );
  });
}
