import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Queue, Severity } from '../../../../core/models/domain';
import {
  getInverseSeverity,
  getRatioSeverity,
  getSeverity,
  STATUS_THRESHOLDS,
} from '../../../../core/policies/status-thresholds.policy';

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
  readonly variant = input.required<QueueListVariant>();
  readonly queues = input<Queue[]>([]);

  readonly title = computed(() => (this.variant() === 'waiting' ? 'Waiting Queue' : 'Serving Queue'));

  readonly hasData = computed(() => this.queues().length > 0);

  // All nine required parameters, aggregated across every queue into one
  // fixed reading order: call volume, then queue health/wait, then
  // agent capacity & outcome.
  readonly stats = computed<QueueStat[]>(() => this.aggregate(this.queues()));

  private formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  private aggregate(queues: Queue[]): QueueStat[] {
    const sum = (pick: (q: Queue) => number) => queues.reduce((total, q) => total + pick(q), 0);
    const max = (pick: (q: Queue) => number) => queues.reduce((best, q) => Math.max(best, pick(q)), 0);
    // Call-volume-weighted average: each queue's number counts in
    // proportion to how many calls it actually handled, not equally.
    const weightedAverage = (pick: (q: Queue) => number, weightPick: (q: Queue) => number) => {
      const totalWeight = sum(weightPick);
      if (totalWeight <= 0) return 0;
      return queues.reduce((total, q) => total + pick(q) * weightPick(q), 0) / totalWeight;
    };

    const totalCalls = sum((q) => q.totalCalls);
    const handledCalls = sum((q) => q.handledCalls);
    const abandonedCalls = sum((q) => q.abandonedCalls);
    const callsWaiting = sum((q) => q.callsWaiting);
    const readyAgents = sum((q) => q.agentStates.ready);
    const currentWaitSeconds = max((q) => q.currentWaitSeconds);
    const maxAbandonSeconds = max((q) => q.maxAbandonSeconds);
    const avgHandleSeconds = weightedAverage((q) => q.avgHandleSeconds, (q) => q.handledCalls);
    const slaPercent = weightedAverage((q) => q.slaPercent, (q) => q.totalCalls);

    const abandonedSeverity = getRatioSeverity(abandonedCalls, totalCalls, STATUS_THRESHOLDS.abandonedRatio);
    const currentWaitSeverity = getSeverity(currentWaitSeconds, STATUS_THRESHOLDS.currentWaitSeconds);
    const slaSeverity = getInverseSeverity(slaPercent, STATUS_THRESHOLDS.slaPercent);

    return [
      { label: 'Inbound', value: `${totalCalls}`, severity: 'normal' },
      { label: 'Handled', value: `${handledCalls}`, severity: 'normal' },
      { label: 'In queue', value: `${callsWaiting}`, severity: 'normal' },
      { label: 'Abandons', value: `${abandonedCalls}`, severity: abandonedSeverity },
      { label: 'CWD', value: this.formatDuration(currentWaitSeconds), severity: currentWaitSeverity },
      { label: 'MAD', value: this.formatDuration(maxAbandonSeconds), severity: 'normal' },
      { label: 'ACT', value: this.formatDuration(avgHandleSeconds), severity: 'normal' },
      { label: 'Ready', value: `${readyAgents}`, severity: 'normal' },
      { label: 'SLA', value: `${slaPercent.toFixed(1)}%`, severity: slaSeverity },
    ];
  }
}
