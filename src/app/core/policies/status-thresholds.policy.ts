import { Severity } from '../models/domain';

export interface Thresholds {
  warning: number;
  critical: number;
}

// The shape of the configurable threshold set — every metric on the board
// that gets a normal/warning/critical color has an entry here. Components
// never hardcode a number; they read the live value from AppConfigService
// (see core/config/app-config.service.ts) and call getSeverity() /
// getInverseSeverity() / getRatioSeverity() below.
export interface StatusThresholds {
  abandonedRatio: Thresholds;
  avgWaitSeconds: Thresholds;
  avgTalkSeconds: Thresholds;
  callsWaiting: Thresholds;
  notReadyRatio: Thresholds;
  // Lower is worse for SLA/FCR/CSAT, so these are floors, checked by getInverseSeverity.
  slaPercent: Thresholds;
  fcrPercent: Thresholds;
  // CSAT is a 0-5 scale (see ServiceMetrics.csatScore) — not a percentage,
  // unlike its neighbors here.
  csatScore: Thresholds;
  // CWD — Current Wait Duration, the longest a caller is waiting right now.
  currentWaitSeconds: Thresholds;
}

// Defaults, used two ways: (1) as AppConfigService's fallback if
// assets/config.json is missing/unreachable, and (2) merged underneath
// whatever assets/config.json does specify, so a config file only needs
// to list the thresholds it wants to override — see AppConfigService.load().
//
// These are NOT read directly by components — that would bring back a
// compile-time constant that can't be changed without a rebuild, which is
// exactly what runtime configurability is meant to avoid. Components read
// `appConfig.config().thresholds` instead.
export const DEFAULT_STATUS_THRESHOLDS: StatusThresholds = {
  abandonedRatio: { warning: 0.05, critical: 0.1 },
  avgWaitSeconds: { warning: 30, critical: 60 },
  avgTalkSeconds: { warning: 120, critical: 180 },
  callsWaiting: { warning: 3, critical: 6 },
  notReadyRatio: { warning: 0.3, critical: 0.5 },
  slaPercent: { warning: 80, critical: 50 },
  fcrPercent: { warning: 75, critical: 60 },
  csatScore: { warning: 4, critical: 3.5 },
  currentWaitSeconds: { warning: 45, critical: 90 },
};

// Which metrics getInverseSeverity applies to (lower value = worse) — a
// single source of truth AppConfigService's ordering validation reads from,
// so it can never drift out of sync with which comparison direction each
// metric's components actually use.
export const INVERSE_SEVERITY_METRICS: ReadonlySet<keyof StatusThresholds> = new Set([
  'slaPercent',
  'fcrPercent',
  'csatScore',
]);

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

export function getRatioSeverity(
  numerator: number,
  denominator: number,
  thresholds: Thresholds,
): Severity {
  if (denominator <= 0) return 'normal';
  return getSeverity(numerator / denominator, thresholds);
}
