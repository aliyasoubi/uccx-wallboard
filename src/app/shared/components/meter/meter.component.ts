import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type MeterSeverity = 'normal' | 'warning' | 'critical';

// A semicircular dial gauge — no charting library needed for something this
// simple. Every arc segment uses SVG `pathLength="100"`, so stroke-dasharray
// / stroke-dashoffset are expressed directly as 0-100 percentages instead of
// requiring circumference math per radius.
//
// Layout is deliberately split in two: a header row (icon badge + label +
// status pill) sits OUTSIDE the dial's SVG box, and the dial itself renders
// nothing but the arc and the big value. Cramming icon+value+label+pill all
// into the semicircle's small flat-bottom negative space (the original
// design) left every element too small to read at wallboard distance. This
// way the value — the one number a viewer actually needs — gets the dial's
// full text band to itself.
//
// The outer thin ring renders the configured warning/critical zone bands (if
// given) so a viewer can see how much headroom remains before a breach
// without reading the number. That ordering assumes "lower is worse" — the
// critical zone sits at the LOW end of the scale. True for both current
// consumers (SLA%, CSAT), which are both inverse-severity metrics (see
// INVERSE_SEVERITY_METRICS in status-thresholds.policy.ts). A future
// "higher is worse" metric would need its own zone ordering, not a flip of
// these two inputs.
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
  /** Optional Tabler icon class (e.g. 'ti-shield-check'), same convention as MetricTileComponent. */
  readonly icon = input<string>('');
  readonly iconColorVar = input<string>('var(--color-status-accent)');
  /** Background tint for the icon badge — pass a `--color-status-*-bg` token so the badge tint tracks severity. */
  readonly iconBgVar = input<string>('var(--color-status-accent-bg)');
  readonly severity = input<MeterSeverity>('normal');
  /** Short status word shown beside the label, e.g. "On Target" / "At Risk". Omitted renders nothing. */
  readonly statusLabel = input<string>('');
  /** Zone boundary values on the same 0-max scale as `value`. Both must be set to draw the zone ring. */
  readonly warningValue = input<number | null>(null);
  readonly criticalValue = input<number | null>(null);

  readonly ratio = computed(() => {
    const max = this.max();
    const value = this.value();
    // Non-finite guard: a NaN/undefined reading would otherwise propagate
    // into stroke-dasharray as "NaN NaN", which SVG rejects silently — the
    // arc just stops drawing with no error anywhere.
    if (!max || max <= 0 || !Number.isFinite(value)) return 0;
    return Math.min(1, Math.max(0, value / max));
  });

  readonly valueDashArray = computed(() => {
    const filled = this.ratio() * 100;
    return `${filled} ${100 - filled}`;
  });

  readonly hasZones = computed(() => {
    const max = this.max();
    return this.warningValue() != null && this.criticalValue() != null && max > 0;
  });

  private toFraction(v: number | null): number {
    const max = this.max();
    if (v == null || !max) return 0;
    return Math.min(100, Math.max(0, (v / max) * 100));
  }

  private readonly criticalFrac = computed(() => this.toFraction(this.criticalValue()));
  private readonly warningFrac = computed(() => this.toFraction(this.warningValue()));

  readonly criticalZoneDash = computed(() => {
    const f = this.criticalFrac();
    return `${f} ${100 - f}`;
  });

  readonly warningZoneDash = computed(() => {
    const span = Math.max(0, this.warningFrac() - this.criticalFrac());
    return `${span} ${100 - span}`;
  });

  readonly warningZoneOffset = computed(() => -this.criticalFrac());

  readonly normalZoneDash = computed(() => {
    const span = Math.max(0, 100 - this.warningFrac());
    return `${span} ${100 - span}`;
  });

  readonly normalZoneOffset = computed(() => -this.warningFrac());
}
