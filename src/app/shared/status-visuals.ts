import { AgentStatus } from '../core/models/domain';

export interface StatusVisual {
  label: string;
  colorVar: string;
  bgVar: string;
  /** Tabler icon class — a second, non-color signal alongside the label text, same "never color-only" a11y guarantee as before. */
  icon: string;
}

// Single source of truth for how each agent status is represented visually —
// shared by StatusBadgeComponent and AgentSummaryComponent's avatars so the
// two always agree. Status meaning is never color-only: label text always
// accompanies the color (a11y requirement).
//
// Not Ready uses --color-text-secondary, not --color-status-neutral: the
// latter measured 3.19:1 on --color-surface-2, below WCAG AA's 4.5:1 floor.
export const AGENT_STATUS_VISUALS: Record<AgentStatus, StatusVisual> = {
  [AgentStatus.Ready]: {
    label: 'Ready',
    colorVar: 'var(--color-status-normal)',
    bgVar: 'var(--color-status-normal-bg)',
    icon: 'ti-circle-check',
  },
  [AgentStatus.Talking]: {
    label: 'Talking',
    colorVar: 'var(--color-status-accent)',
    bgVar: 'var(--color-status-accent-bg)',
    icon: 'ti-phone',
  },
  [AgentStatus.NotReady]: {
    label: 'Not ready',
    colorVar: 'var(--color-text-secondary)',
    bgVar: 'var(--color-surface-2)',
    icon: 'ti-player-pause',
  },
};
