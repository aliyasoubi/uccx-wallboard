import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShiftMetrics } from '../../../../core/models/domain';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';

@Component({
  selector: 'app-shift-metrics-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatDurationPipe],
  templateUrl: './shift-metrics-panel.component.html',
  styleUrl: './shift-metrics-panel.component.scss',
})
export class ShiftMetricsPanelComponent {
  readonly metrics = input<ShiftMetrics | null>(null);
}
