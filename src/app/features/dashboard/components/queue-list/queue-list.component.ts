import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Queue } from '../../../../core/models/domain';
import {
  getInverseSeverity,
  getRatioSeverity,
  getSeverity,
  STATUS_THRESHOLDS,
} from '../../../../core/policies/status-thresholds.policy';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';

export type QueueListVariant = 'waiting' | 'serving';

interface QueueRowSeverity {
  abandoned: 'normal' | 'warning' | 'critical';
  currentWait: 'normal' | 'warning' | 'critical';
  sla: 'normal' | 'warning' | 'critical';
}

// Module 10, "Queue Displays" — same Queue domain model and parameters as
// before (Inbound/Handled/In Queue/Abandons/CWD/MAD/ACT/Ready Agents/SLA),
// but a wallboard fitting a fixed viewport with no scrolling can't stack a
// full card per CSQ (that's unbounded height as the queue list grows).
// Instead this renders as a compact table, one row per queue, split into
// two purpose-built views that share this one component (`variant` input,
// same DRY pattern as TopAgentComponent/CallDirectionPanelComponent
// elsewhere in this codebase):
//
//   "waiting"  — caller-experience/queue-health columns: what's happening
//                to a call BEFORE an agent picks it up.
//   "serving"  — agent-capacity/throughput columns: what's happening
//                AFTER an agent picks it up.
//
// This is a presentation-layer split only — Queue, CsqDto, and
// queue.mapper.ts are unchanged from the card-based version.
@Component({
  selector: 'app-queue-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatDurationPipe],
  templateUrl: './queue-list.component.html',
  styleUrl: './queue-list.component.scss',
})
export class QueueListComponent {
  readonly variant = input.required<QueueListVariant>();
  readonly queues = input<Queue[]>([]);

  readonly title = computed(() => (this.variant() === 'waiting' ? 'Waiting Queue' : 'Serving Queue'));

  trackByQueueName(_index: number, queue: Queue): string {
    return queue.name;
  }

  severityFor(queue: Queue): QueueRowSeverity {
    return {
      abandoned: getRatioSeverity(queue.abandonedCalls, queue.totalCalls, STATUS_THRESHOLDS.abandonedRatio),
      currentWait: getSeverity(queue.currentWaitSeconds, STATUS_THRESHOLDS.currentWaitSeconds),
      sla: getInverseSeverity(queue.slaPercent, STATUS_THRESHOLDS.slaPercent),
    };
  }
}
