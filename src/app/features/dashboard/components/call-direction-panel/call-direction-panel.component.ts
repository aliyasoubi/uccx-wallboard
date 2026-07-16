import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CallDirectionStats } from '../../../../core/models/domain';

// Reused for both Inbound and Outbound panels — same component, different
// input, instead of two near-duplicate implementations.
@Component({
  selector: 'app-call-direction-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './call-direction-panel.component.html',
  styleUrl: './call-direction-panel.component.scss',
})
export class CallDirectionPanelComponent {
  readonly stats = input<CallDirectionStats | null>(null);
  readonly icon = input<string>('ti-phone');
}
