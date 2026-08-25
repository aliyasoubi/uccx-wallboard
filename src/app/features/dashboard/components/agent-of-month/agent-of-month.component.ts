import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Agent, AgentOfMonth } from '../../../../core/models/domain';

interface PodiumEntry {
  agentId: string;
  name: string;
  photoUrl: string | null;
  initials: string;
  /** 1-based finishing position. */
  rank: number;
  /** Total calls for this winner, or null when they are no longer on the roster. */
  calls: number | null;
}

// Module 5, "Agents of the Month". Rendered as a podium (2nd | 1st | 3rd)
// under Agent Summary, per the client's layout reference.
@Component({
  selector: 'app-agent-of-month',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-of-month.component.html',
  styleUrl: './agent-of-month.component.scss',
})
export class AgentOfMonthComponent {
  readonly agents = input<AgentOfMonth[] | null>(null);
  

  /** The podium layout is a fixed 3-column grid — see the .podium CSS. */
  private static readonly MAX_WINNERS = 3;

  // `photoUrl` being non-null says a URL was supplied, not that it actually
  // loads — a broken (non-empty) URL rendered a broken-image icon instead of
  // falling back to initials, because the template's @if only ever checked
  // the data, never the <img>'s own (error) event. This tracks per-agent
  // load failures so the fallback triggers at render time regardless of why
  // the image failed.
  private readonly failedPhotoIds = signal<ReadonlySet<string>>(new Set());

  onPhotoError(agentId: string): void {
    this.failedPhotoIds.update((prev) => new Set(prev).add(agentId));
  }

  private readonly entries = computed<PodiumEntry[]>(() => {
    const failed = this.failedPhotoIds();
    return (this.agents() ?? []).map((agent, i) => {
      return {
        agentId: agent.agentId,
        name: agent.name ?? '—',
        photoUrl: failed.has(agent.agentId) ? null : agent.photoUrl,
        initials: initialsOf(agent.name),
        rank: i + 1,
        calls: null,
      };
    });
  });

  /**
   * Podium display order: 2nd, 1st, 3rd — so first place sits in the middle
   * and reads as the peak, matching how a real podium is arranged. Ranks stay
   * attached to each entry, so this is presentation order only, never a
   * reordering of the actual standings. `entries` is already capped at 3, so
   * there is never a slice(3) remainder to append here.
   */
  readonly podium = computed<PodiumEntry[]>(() => {
    const entries = this.entries();
    const [first, second, third] = entries;
    if (entries.length < 3) return entries;
    return [second, first, third];
  });
}

// Falls back to '?' for a missing/blank name so the avatar is never empty.
function initialsOf(name: string | null): string {
  if (!name) return '?';
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
