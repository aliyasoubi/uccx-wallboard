import { AgentStatus } from '../core/models/domain';

export interface StatusVisual {
  label: string;
  colorVar: string;
  bgVar: string;
}

// Single source of truth for how each agent status is represented
// visually (label, foreground color, background tint) — shared by
// StatusBadgeComponent and AgentSummaryComponent's status-tinted avatars,
// so the two always stay in sync instead of maintaining two copies of the
// same color mapping. Status meaning is never color-only: label text
// always accompanies the color, satisfying the accessibility requirement
// from the README.
//
// Not Ready previously paired --color-status-neutral text on
// --color-surface-2 — measured at 3.19:1 contrast, below WCAG AA's 4.5:1
// floor for normal-size text. --color-text-secondary on the same
// background measures ~6.4:1, comfortably passing, while staying visually
// "neutral" rather than borrowing an alarm color the state doesn't warrant.
export const AGENT_STATUS_VISUALS: Record<AgentStatus, StatusVisual> = {
  [AgentStatus.Ready]: {
    label: 'Ready',
    colorVar: 'var(--color-status-normal)',
    bgVar: 'var(--color-status-normal-bg)',
  },
  [AgentStatus.Talking]: {
    label: 'Talking',
    colorVar: 'var(--color-status-accent)',
    bgVar: 'var(--color-status-accent-bg)',
  },
  [AgentStatus.NotReady]: {
    label: 'Not ready',
    colorVar: 'var(--color-text-secondary)',
    bgVar: 'var(--color-surface-2)',
  },
};
