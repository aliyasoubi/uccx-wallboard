import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Queue } from '../../../../core/models/domain';
import { getRatioSeverity, STATUS_THRESHOLDS } from '../../../../core/policies/status-thresholds.policy';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';

@Component({
  selector: 'app-queue-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatDurationPipe],
  templateUrl: './queue-panel.component.html',
  styleUrl: './queue-panel.component.scss',
})
export class QueuePanelComponent {
  readonly queue = input.required<Queue>();

  // Collapses to a compact "no activity" row instead of a full empty panel —
  // this is the direct fix for the old dashboard giving VIP/Registration the
  // same footprint as Support despite having zero calls.
  readonly hasActivity = computed(() => this.queue().totalCalls > 0);

  readonly abandonedSeverity = computed(() =>
    getRatioSeverity(this.queue().abandonedCalls, this.queue().totalCalls, STATUS_THRESHOLDS.abandonedRatio),
  );
}
