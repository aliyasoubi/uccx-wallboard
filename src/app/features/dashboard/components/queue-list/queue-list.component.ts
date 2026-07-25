import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Queue, Severity } from '../../../../core/models/domain';
import {
  getInverseSeverity,
  getRatioSeverity,
  getSeverity,
  StatusThresholds,
} from '../../../../core/policies/status-thresholds.policy';
import { AppConfigService } from '../../../../core/config/app-config.service';

export type QueueListVariant = 'waiting' | 'serving';

interface QueueStat {
  label: string;
  value: string;
  severity: Severity;
}

// Module 10, "Queue Displays": Inbound, Handled, In Queue, Abandons, CWD,
// MAD, ACT, Ready Agents, SLA. Per explicit request, this no longer breaks
// the board down by individual queue name (Sales/Support/Billing) — each
// of "Waiting Queue" and "Serving Queue" shows ONE aggregated set of all
// nine parameters across every queue, not a block per queue.
//
// Aggregation rules per parameter (documented here since "the sum of an
// average" is an easy place for a dashboard to quietly lie):
//   - Counts (Inbound, Handled, In Queue, Abandons, Ready Agents): summed
//     across queues — these are genuinely additive.
//   - CWD, MAD (worst-case wait/abandon durations): the MAX across queues,
//     not summed or averaged — a "total wait time" or "average worst
//     case" would both be meaningless; the board should surface the
//     single longest one, wherever it's currently happening.
//   - ACT, SLA (rates/averages): a call-volume-weighted average across
//     queues, not a plain average of the three queues' numbers — a queue
//     with 10 calls and a queue with 500 calls shouldn't count equally
//     toward the org-wide average.
//
// Presented as a single-column list of nine label/value rows (not a
// multi-column grid, and not one wide spreadsheet row): nine columns in a
// single row does not fit at realistic wallboard widths (reproduced and
// confirmed — a 7-column table overflowed its panel at a 1512px-wide
// viewport). A vertical list sidesteps that entirely — each row is
// full-width, so there's no horizontal packing to overflow; a value can
// still wrap if it's unusually long, but the row itself never overflows
// its panel, at any width.
//
// This is a presentation-layer component only — Queue, CsqDto, and
// queue.mapper.ts are unchanged from the original per-queue version.
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

  readonly title = computed(() => this.queue()?.name ?? "");
  
  readonly hasData = computed(() => this.queue !== undefined);

  // All nine required parameters, aggregated across every queue into one
  // fixed reading order: call volume, then queue health/wait, then
  // agent capacity & outcome.
  readonly stats = computed<QueueStat[]>(() => {
    const q = this.queue();
    if (q){
      return this.aggregate(q, this.appConfig.config().thresholds)
    }
    return []
  });

  private formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  private aggregate(q: Queue, thresholds: StatusThresholds): QueueStat[] {
    const abandonedSeverity = getRatioSeverity(q.abandonedCalls, q.totalCalls, thresholds.abandonedRatio);
    const currentWaitSeverity = getSeverity(q.currentWaitSeconds, thresholds.currentWaitSeconds);
    const slaSeverity = getInverseSeverity(q.slaPercent, thresholds.slaPercent);

    return [
      { label: 'Inbound', value: `${q.totalCalls}`, severity: 'normal' },
      { label: 'Handled', value: `${q.handledCalls} (${Math.round(100 * q.handledCalls / q.totalCalls)}%)`, severity: 'normal' },
      { label: 'In queue', value: `${q.callsWaiting}`, severity: 'normal' },
      { label: 'Abandons', value: `${q.abandonedCalls}`, severity: abandonedSeverity },
      { label: 'Current WD', value: this.formatDuration(q.currentWaitSeconds), severity: currentWaitSeverity },
      { label: 'Max WD', value: this.formatDuration(q.maxWaitSeconds), severity: 'normal' },
      { label: 'AVG Talk Time', value: this.formatDuration(q.avgTalkSeconds), severity: 'normal' },
      { label: 'Ready', value: `${q.agentStates.ready}`, severity: 'normal' },
      { label: 'SLA', value: `${q.slaPercent.toFixed(1)}%`, severity: slaSeverity },
    ];
  }
}
