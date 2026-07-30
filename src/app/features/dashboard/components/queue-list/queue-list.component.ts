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
  
  readonly hasData = computed(() => this.queue() !== undefined);


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
