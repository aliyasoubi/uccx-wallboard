import { Severity } from '../models/domain';

// The ONLY place threshold numbers are allowed to live. Components must call
// getSeverity() rather than writing their own `value > 30 ? 'orange' : ...` checks.
export const STATUS_THRESHOLDS = {
  abandonedRatio: { warning: 0.05, critical: 0.1 },
  avgWaitSeconds: { warning: 30, critical: 60 },
  avgTalkSeconds: { warning: 120, critical: 180 },
  callsWaiting: { warning: 3, critical: 6 },
  notReadyRatio: { warning: 0.3, critical: 0.5 },
  // Lower is worse for SLA, so these are floors, checked by getInverseSeverity.
  slaPercent: { warning: 80, critical: 50 },
} as const;

export interface Thresholds {
  warning: number;
  critical: number;
}

export function getSeverity(value: number, thresholds: Thresholds): Severity {
  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.warning) return 'warning';
  return 'normal';
}

// For metrics where LOWER is worse (e.g. SLA%) — critical/warning are floors,
// not ceilings, so the comparison direction flips.
export function getInverseSeverity(value: number, thresholds: Thresholds): Severity {
  if (value <= thresholds.critical) return 'critical';
  if (value <= thresholds.warning) return 'warning';
  return 'normal';
}

export function getRatioSeverity(numerator: number, denominator: number, thresholds: Thresholds): Severity {
  if (denominator <= 0) return 'normal';
  return getSeverity(numerator / denominator, thresholds);
}
