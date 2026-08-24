import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { AgentOfMonth } from '../../../../core/models/domain';

// Module 5, "Agent of the Month".
@Component({
  selector: 'app-agent-of-month',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-of-month.component.html',
  styleUrl: './agent-of-month.component.scss',
})
export class AgentOfMonthComponent {
  readonly agent = input<AgentOfMonth | null>(null);

  // A non-null photoUrl only says a URL was supplied, not that it actually
  // loads — a broken (non-empty) URL rendered a broken-image icon instead
  // of falling back to initials, because the template's @if only ever
  // checked the data, never the <img>'s own (error) event.
  //
  // Tracks the specific URL that failed, not a plain boolean: the board
  // polls and can hand this component a new agent (a new photoUrl) at any
  // time, and a stale "failed" flag must not suppress a brand new,
  // perfectly good photo just because a *previous* agent's photo broke.
  // Comparing against the current photoUrl resets this for free once it
  // changes, with no separate reset logic needed.
  private readonly failedPhotoUrl = signal<string | null>(null);

  onPhotoError(): void {
    this.failedPhotoUrl.set(this.agent()?.photoUrl ?? null);
  }

  readonly showPhoto = computed(() => {
    const url = this.agent()?.photoUrl;
    return !!url && url !== this.failedPhotoUrl();
  });

  // Defined fallback for the empty photoUrl observed in the sample data,
  // rather than letting an <img> render broken.
  readonly initials = computed(() => {
    const name = this.agent()?.name;
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });
}
