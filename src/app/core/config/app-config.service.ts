import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from './app-config.model';
import { DEFAULT_STATUS_THRESHOLDS, StatusThresholds } from '../policies/status-thresholds.policy';

const FALLBACK_CONFIG: AppConfig = {
  apiBaseUrl: 'assets/fixtures',
  pollIntervalMs: 3000,
  thresholds: DEFAULT_STATUS_THRESHOLDS,
};

// What assets/config.json is actually allowed to contain: apiBaseUrl and
// pollIntervalMs stay required-if-present, but thresholds is deliberately
// deep-partial — a deployment only needs to list the specific metrics it
// wants to override (e.g. just `slaPercent`), not restate every one.
type PartialAppConfig = Partial<Omit<AppConfig, 'thresholds'>> & {
  thresholds?: Partial<StatusThresholds>;
};

// Runtime configuration, loaded from assets/config.json BEFORE the app
// bootstraps (see provideAppInitializer in app.config.ts). This is
// deliberately NOT an Angular environment.ts file — environment.ts values
// are baked into the JS bundle at build time, so changing them means a full
// rebuild and redeploy. Reading a plain JSON file at startup means ops can
// change the API URL, poll interval, or any severity threshold by editing
// one file on the server and refreshing the page — no rebuild required.
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private readonly _config = signal<AppConfig>(FALLBACK_CONFIG);

  readonly config = this._config.asReadonly();

  async load(): Promise<void> {
    try {
      const loaded = await firstValueFrom(this.http.get<PartialAppConfig>('assets/config.json'));
      this._config.set({
        ...FALLBACK_CONFIG,
        ...loaded,
        // A plain `{...FALLBACK_CONFIG, ...loaded}` would work fine for
        // apiBaseUrl/pollIntervalMs, but for `thresholds` it would silently
        // drop every default metric not explicitly repeated in the loaded
        // file — e.g. specifying only `slaPercent` would wipe out
        // avgWaitSeconds/currentWaitSeconds/etc. entirely instead of just
        // overriding the one metric. This merges one level deeper so each
        // threshold key is independently overridable.
        thresholds: { ...FALLBACK_CONFIG.thresholds, ...loaded.thresholds },
      });
    } catch (err) {
      console.error('[AppConfigService] Failed to load assets/config.json, using fallback config', err);
      this._config.set(FALLBACK_CONFIG);
    }
  }
}
