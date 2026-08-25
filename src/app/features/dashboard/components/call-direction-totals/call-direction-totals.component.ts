import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MetricTileComponent } from '../../../../shared/components';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';
import { TotalCallSummary } from '../../../../core/models/domain/total-call-summary.model';
import { FormatDurationLargePipe } from '../../../../shared/pipes/format-duration-large.pipe';

// Organization-wide inbound/outbound totals, shown beneath the queue panels.
// Replaced the Agent State + Agent of the Month pair that used to sit here
// (client request) — those two components still exist; Agent of the Month
// moved under Agent Summary in column 3.
//
// Values come from the direction-level endpoints via CallDirectionStats, not
// from summing the agent roster, so they stay correct when an agent logs out
// mid-shift.
@Component({
  selector: 'app-call-direction-totals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MetricTileComponent, FormatDurationLargePipe],
  templateUrl: './call-direction-totals.component.html',
  styleUrl: './call-direction-totals.component.scss',
})
export class CallDirectionTotalsComponent {
  readonly summary = input<TotalCallSummary | null>(null);
}
