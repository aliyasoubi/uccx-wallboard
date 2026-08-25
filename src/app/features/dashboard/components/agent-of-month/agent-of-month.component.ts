import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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
  

  private readonly entries = computed<PodiumEntry[]>(() => {
    return (this.agents() ?? []).map((agent, i) => {
      return {
        agentId: agent.agentId,
        name: agent.name ?? '—',
        photoUrl: agent.photoUrl,
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
   * reordering of the actual standings.
   */
  readonly podium = computed<PodiumEntry[]>(() => {
    const entries = this.entries();
    const [first, second, third] = entries;
    if (entries.length < 3) return entries;
    return [second, first, third, ...entries.slice(3)];
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
