import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// A lightweight SVG ring gauge — no charting library dependency required for
// something this simple. Swap for the ECharts wrapper from the README if the
// dashboard later needs richer chart types (trend lines, etc.) elsewhere.
//
// Fill technique: stroke-dasharray is set directly to "<filled> <remaining>"
// rather than a fixed dasharray + computed dashoffset. Both are valid SVG,
// but this version states the filled arc length explicitly — there's no
// offset math to double-check, so a wrong ratio is visible immediately in
// the bound value rather than needing to be reverse-engineered from an
// offset number.
@Component({
  selector: 'app-meter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meter.component.html',
  styleUrl: './meter.component.scss',
})
export class MeterComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>(); // 0-max
  readonly max = input<number>(100);
  readonly displayValue = input<string>('');
  readonly colorVar = input<string>('var(--color-status-normal)');
  /** Optional Tabler icon class (e.g. 'ti-shield-check'), same convention as MetricTileComponent. Omitted rings render exactly as before. */
  readonly icon = input<string>('');
  readonly iconColorVar = input<string>('var(--color-status-accent)');

  private readonly radius = 42;
  readonly circumference = 2 * Math.PI * this.radius;

  readonly ratio = computed(() => {
    const max = this.max();
    const value = this.value();
    // Non-finite guard: a NaN/undefined reading would otherwise propagate
    // into stroke-dasharray as "NaN NaN", which SVG rejects silently — the
    // ring just stops drawing with no error anywhere.
    if (!max || max <= 0 || !Number.isFinite(value)) return 0;
    return Math.min(1, Math.max(0, value / max));
  });

  readonly dashArray = computed(() => {
    const filled = this.ratio() * this.circumference;
    const remaining = this.circumference - filled;
    return `${filled} ${remaining}`;
  });
}
