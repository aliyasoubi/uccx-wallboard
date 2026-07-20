import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AgentStateSummary } from '../../../core/models/domain';

interface Segment {
  key: 'ready' | 'talking' | 'notReady';
  value: number;
  colorVar: string;
  dashArray: string;
  dashOffset: string;
}

const CIRCUMFERENCE = 2 * Math.PI * 15.9;

// The center total is always the literal sum of the visible segments —
// this is the direct fix for the old design showing a center number that
// didn't match Ready + Talking + Not ready.
@Component({
  selector: 'app-agent-state-donut',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './agent-state-donut.component.html',
  styleUrl: './agent-state-donut.component.scss',
})
export class AgentStateDonutComponent {
  readonly summary = input<AgentStateSummary | null>(null);

  readonly total = computed(() => {
    const s = this.summary();
    if (!s) return 0;
    return s.ready + s.talking + s.notReady;
  });

  readonly segments = computed<Segment[]>(() => {
    const s = this.summary();
    const total = this.total();
    if (!s || total === 0) return [];

    const raw: { key: Segment['key']; value: number; colorVar: string }[] = [
      { key: 'ready', value: s.ready, colorVar: 'var(--color-status-normal)' },
      { key: 'talking', value: s.talking, colorVar: 'var(--color-status-accent)' },
      { key: 'notReady', value: s.notReady, colorVar: 'var(--color-status-critical)' },
    ];

    let offsetSoFar = 0;
    return raw.map((seg) => {
      const length = (seg.value / total) * CIRCUMFERENCE;
      const dashArray = `${length} ${CIRCUMFERENCE - length}`;
      const dashOffset = `${-offsetSoFar}`;
      offsetSoFar += length;
      return { ...seg, dashArray, dashOffset };
    });
  });
}
