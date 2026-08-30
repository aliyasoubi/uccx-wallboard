import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Queue, Severity } from '../../../../core/models/domain';
import {
  getInverseSeverity,
  getRatioSeverity,
  getSeverity,
  StatusThresholds,
} from '../../../../core/policies/status-thresholds.policy';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { formatDurationSeconds } from '../../../../shared/pipes/format-duration.pipe';

/** Shown in place of a percentage that has no meaningful value (0 of 0 calls). */
const PERCENT_PLACEHOLDER = '--%';

interface QueueStat {
  label: string;
  value: string;
  severity: Severity;
}

@Component({
  selector: 'app-queue-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './queue-list.component.html',
  styleUrl: './queue-list.component.scss',
})
export class QueueListComponent {
  private readonly appConfig = inject(AppConfigService);

  readonly queue = input<Queue | undefined>(undefined);

  readonly title = computed(() => this.queue()?.name ?? '');

  readonly hasData = computed(() => this.queue() !== undefined);

  readonly stats = computed<QueueStat[]>(() => {
    const q = this.queue();
    if (q) {
      return this.aggregate(q, this.appConfig.config().thresholds);
    }
    return [];
  });

  // Percentage of handled calls, or the placeholder when the queue has taken
  // no calls at all — 0/0 is NaN, which used to reach the wallboard as
  // "0 (NaN%)" for any idle CSQ (start of day, or a queue with no traffic yet).
  private handledPercent(q: Queue): string {
    if (!q.totalCalls) return `${q.handledCalls} (${PERCENT_PLACEHOLDER})`;
    return `${q.handledCalls} (${Math.round((100 * q.handledCalls) / q.totalCalls)}%)`;
  }

  private aggregate(q: Queue, thresholds: StatusThresholds): QueueStat[] {
    const abandonedSeverity = getRatioSeverity(
      q.abandonedCalls,
      q.totalCalls,
      thresholds.abandonedRatio,
    );
    const currentWaitSeverity = getSeverity(q.currentWaitSeconds, thresholds.currentWaitSeconds);
    const slaSeverity = getInverseSeverity(q.slaPercent, thresholds.slaPercent);

    return [
      { label: 'Inbound', value: `${q.totalCalls}`, severity: 'normal' },
      { label: 'Handled', value: this.handledPercent(q), severity: 'normal' },
      { label: 'In queue', value: `${q.callsWaiting}`, severity: 'normal' },
      { label: 'Abandons', value: `${q.abandonedCalls}`, severity: abandonedSeverity },
      // Display labels only, renamed from CWD/MWD for readability — the
      // underlying field meanings are still provisional (see Queue domain
      // model / queue.mapper.ts).
      {
        label: 'Current wait',
        value: formatDurationSeconds(q.currentWaitSeconds),
        severity: currentWaitSeverity,
      },
      { label: 'Longest wait', value: formatDurationSeconds(q.maxWaitSeconds), severity: 'normal' },
      {
        label: 'AVG Talk Time',
        value: formatDurationSeconds(q.avgTalkSeconds),
        severity: 'normal',
      },
      { label: 'Ready', value: `${q.agentStates.ready}`, severity: 'normal' },
      // toFixed on a missing/null slaPercent throws rather than rendering
      // badly, which would take the whole panel down — same guard as
      // SlaGaugeComponent.hasData.
      {
        label: 'SLA',
        value: Number.isFinite(q.slaPercent) ? `${q.slaPercent.toFixed(1)}%` : PERCENT_PLACEHOLDER,
        severity: slaSeverity,
      },
    ];
  }
}
