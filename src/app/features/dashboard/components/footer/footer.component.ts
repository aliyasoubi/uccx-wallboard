import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { ConnectionState } from '../../../../core/data-access/data-source.token';

const AGE_TICK_MS = 1000;

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
  readonly connectionState = input<ConnectionState>('connecting');
  readonly lastUpdated = input<Date | null>(null);

  private readonly destroyRef = inject(DestroyRef);
  private readonly _now = signal(new Date());

  // Data age wasn't visible anywhere before — only a static "Last update
  // 3:14 PM" that a viewer would have to mentally diff against the wall
  // clock. Ticking this every second (same pattern as HeaderComponent's
  // clock) makes staleness legible at a glance: "Updated 47s ago" during a
  // backend hiccup reads as a problem immediately, where a fixed timestamp
  // does not.
  readonly ageSeconds = computed(() => {
    const updated = this.lastUpdated();
    if (!updated) return null;
    return Math.max(0, Math.round((this._now().getTime() - updated.getTime()) / 1000));
  });

  readonly ageText = computed(() => {
    const seconds = this.ageSeconds();
    if (seconds === null) return null;
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  });

  constructor() {
    const timerId = setInterval(() => this._now.set(new Date()), AGE_TICK_MS);
    this.destroyRef.onDestroy(() => clearInterval(timerId));
  }
}
