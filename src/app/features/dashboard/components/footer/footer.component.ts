import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ConnectionState } from '../../../../core/data-access/data-source.token';

// Module 12, "Footer": System Status, Last Update Time. Preserves the
// exact live/stale/error indicator behavior that used to be written inline
// in dashboard.component.html's <header> — only its location and module
// boundary changed, not its logic.
@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly connectionState = input<ConnectionState>('live');
  readonly lastUpdated = input<Date | null>(null);
}
