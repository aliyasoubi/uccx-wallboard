import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ServiceMetrics } from '../../../../core/models/domain';
import { MeterComponent } from '../../../../shared/components';

// Module 8, "Customer Satisfaction" gauge. Split out of the old
// ServiceMetricsPanelComponent alongside SlaGaugeComponent — see that
// component's header comment for why.
@Component({
  selector: 'app-customer-satisfaction-gauge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeterComponent],
  templateUrl: './customer-satisfaction-gauge.component.html',
  styleUrl: './customer-satisfaction-gauge.component.scss',
})
export class CustomerSatisfactionGaugeComponent {
  readonly metrics = input<ServiceMetrics | null>(null);

  // CSAT is reported on a fixed 0-5 scale by the source system (see
  // ServiceMetrics domain model) — not a magic number, a documented scale
  // boundary.
  readonly maxScore = 5;
}
