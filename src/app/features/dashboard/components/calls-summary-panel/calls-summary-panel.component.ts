import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getRatioSeverity, getSeverity, STATUS_THRESHOLDS } from '../../../../core/policies/status-thresholds.policy';
import { CallSummary } from '../../../../core/models/domain';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';
import { MetricTileComponent } from '../../../../shared/components';

@Component({
  selector: 'app-calls-summary-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricTileComponent, FormatDurationPipe],
  templateUrl: './calls-summary-panel.component.html',
  styleUrl: './calls-summary-panel.component.scss',
})
export class CallsSummaryPanelComponent {
  readonly summary = input<CallSummary | null>(null);

  readonly abandonedSeverity = computed(() => {
    const s = this.summary();
    if (!s) return 'normal' as const;
    return getRatioSeverity(s.abandonedCalls, s.totalCalls, STATUS_THRESHOLDS.abandonedRatio);
  });

  readonly waitSeverity = computed(() => {
    const s = this.summary();
    if (!s) return 'normal' as const;
    return getSeverity(s.avgWaitSeconds, STATUS_THRESHOLDS.avgWaitSeconds);
  });

  readonly talkSeverity = computed(() => {
    const s = this.summary();
    if (!s) return 'normal' as const;
    return getSeverity(s.avgTalkSeconds, STATUS_THRESHOLDS.avgTalkSeconds);
  });
}
