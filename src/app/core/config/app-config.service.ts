import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from './app-config.model';
import {
  DEFAULT_STATUS_THRESHOLDS,
  INVERSE_SEVERITY_METRICS,
  StatusThresholds,
  Thresholds,
} from '../policies/status-thresholds.policy';

const FALLBACK_CONFIG: AppConfig = {
  apiBaseUrl: 'assets/fixtures',
  pollIntervalMs: 3000,
  thresholds: DEFAULT_STATUS_THRESHOLDS,
};

// Never poll faster than this, no matter what assets/config.json says — a
// typo'd `"pollIntervalMs": 3` would otherwise hammer the BFF roughly 300x
// more than intended with no error, no warning, nothing to notice until
// someone wonders why the backend is under load.
const MIN_POLL_INTERVAL_MS = 500;

// What assets/config.json is actually allowed to contain: apiBaseUrl and
// pollIntervalMs stay required-if-present, but thresholds is deliberately
// deep-partial — a deployment only needs to list the specific metrics it
// wants to override (e.g. just `slaPercent`), not restate every one, and can
// override just one side of a metric's warning/critical pair.
type PartialThresholds = { [K in keyof StatusThresholds]?: Partial<Thresholds> };
type PartialAppConfig = Partial<Omit<AppConfig, 'thresholds'>> & {
  thresholds?: PartialThresholds;
};

// Runtime configuration, loaded from assets/config.json BEFORE the app
// bootstraps (see provideAppInitializer in app.config.ts). This is
// deliberately NOT an Angular environment.ts file — environment.ts values
// are baked into the JS bundle at build time, so changing them means a full
// rebuild and redeploy. Reading a plain JSON file at startup means ops can
// change the API URL, poll interval, or any severity threshold by editing
// one file on the server and refreshing the page — no rebuild required.
//
// Loaded config is deep-merged onto (never trusted to fully replace) the
// compiled-in defaults, and every value is validated before being applied —
// see validateAndMerge() below. A malformed or partial config.json degrades
// individual fields to their default rather than corrupting the whole
// runtime config or crashing the app.
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private readonly _config = signal<AppConfig>(FALLBACK_CONFIG);

  readonly config = this._config.asReadonly();

  async load(): Promise<void> {
    try {
      const loaded = await firstValueFrom(this.http.get<PartialAppConfig>('assets/config.json'));
      this._config.set(validateAndMerge(loaded));
    } catch (err) {
      console.error(
        '[AppConfigService] Failed to load assets/config.json, using fallback config',
        err,
      );
      this._config.set(FALLBACK_CONFIG);
    }
  }
}

function validateAndMerge(loaded: PartialAppConfig): AppConfig {
  return {
    apiBaseUrl: validApiBaseUrl(loaded.apiBaseUrl),
    pollIntervalMs: validPollInterval(loaded.pollIntervalMs),
    thresholds: mergeThresholds(loaded.thresholds),
  };
}

function validApiBaseUrl(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (value !== undefined) {
    console.warn(
      `[AppConfigService] Ignoring invalid apiBaseUrl (${JSON.stringify(value)}), using fallback`,
    );
  }
  return FALLBACK_CONFIG.apiBaseUrl;
}

function validPollInterval(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= MIN_POLL_INTERVAL_MS)
    return value;
  if (value !== undefined) {
    console.warn(
      `[AppConfigService] Ignoring invalid pollIntervalMs (${JSON.stringify(value)}) — must be a finite number >= ${MIN_POLL_INTERVAL_MS}ms, using fallback`,
    );
  }
  return FALLBACK_CONFIG.pollIntervalMs;
}

// Deep-merges two levels: which metric (slaPercent, avgWaitSeconds, ...) AND
// which side of that metric's pair (warning, critical). A shallower merge —
// replacing a whole `{warning, critical}` pair whenever either side is
// specified — would let a config that overrides only `warning` silently
// drop the default `critical` value, which is exactly the failure mode this
// exists to prevent.
function mergeThresholds(loaded: PartialThresholds | undefined): StatusThresholds {
  const result = { ...DEFAULT_STATUS_THRESHOLDS };
  if (!loaded) return result;

  for (const key of Object.keys(DEFAULT_STATUS_THRESHOLDS) as (keyof StatusThresholds)[]) {
    const override = loaded[key];
    if (!override) continue;
    const candidate: Thresholds = {
      warning: validThresholdValue(
        override.warning,
        DEFAULT_STATUS_THRESHOLDS[key].warning,
        key,
        'warning',
      ),
      critical: validThresholdValue(
        override.critical,
        DEFAULT_STATUS_THRESHOLDS[key].critical,
        key,
        'critical',
      ),
    };
    result[key] = validOrdering(candidate, DEFAULT_STATUS_THRESHOLDS[key], key);
  }
  return result;
}

// Each finite, non-negative number passing validThresholdValue individually
// doesn't guarantee the PAIR makes sense — e.g. slaPercent (lower is worse,
// so critical must be <= warning) configured as {warning: 50, critical: 80}
// is backwards and would silently invert every green/yellow/red on the SLA
// gauge. Falls back to the whole default pair rather than guessing which
// side was the mistake.
function validOrdering(
  candidate: Thresholds,
  fallback: Thresholds,
  metric: keyof StatusThresholds,
): Thresholds {
  const isInverse = INVERSE_SEVERITY_METRICS.has(metric);
  const inOrder = isInverse
    ? candidate.critical <= candidate.warning
    : candidate.critical >= candidate.warning;
  if (inOrder) return candidate;

  console.warn(
    `[AppConfigService] Ignoring thresholds.${metric} — warning (${candidate.warning}) and ` +
      `critical (${candidate.critical}) are ordered backwards for a ${isInverse ? 'lower-is-worse' : 'higher-is-worse'} ` +
      `metric, using the default pair (warning: ${fallback.warning}, critical: ${fallback.critical})`,
  );
  return fallback;
}

function validThresholdValue(
  value: unknown,
  fallback: number,
  metric: string,
  side: 'warning' | 'critical',
): number {
  if (value === undefined) return fallback;
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  console.warn(
    `[AppConfigService] Ignoring invalid threshold thresholds.${metric}.${side} (${JSON.stringify(value)}) — must be a finite number >= 0, using default (${fallback})`,
  );
  return fallback;
}
