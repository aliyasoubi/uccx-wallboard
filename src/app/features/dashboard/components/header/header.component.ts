import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';

const CLOCK_TICK_MS = 1000;

// Module 11, "Header": Title, Clock, Date.
@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly title = input<string>('DotOne Trip Wallboard');

  private readonly destroyRef = inject(DestroyRef);
  private readonly _now = signal(new Date());
  readonly now = this._now.asReadonly();

  constructor() {
    const timerId = setInterval(() => this._now.set(new Date()), CLOCK_TICK_MS);
    this.destroyRef.onDestroy(() => clearInterval(timerId));
  }
}
