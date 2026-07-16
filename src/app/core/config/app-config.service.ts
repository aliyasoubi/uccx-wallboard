import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from './app-config.model';

const FALLBACK_CONFIG: AppConfig = {
  apiBaseUrl: 'assets/fixtures',
  pollIntervalMs: 3000,
};

// Runtime configuration, loaded from assets/config.json BEFORE the app
// bootstraps (see provideAppInitializer in app.config.ts). This is
// deliberately NOT an Angular environment.ts file — environment.ts values
// are baked into the JS bundle at build time, so changing them means a full
// rebuild and redeploy. Reading a plain JSON file at startup means ops can
// change the API URL or poll interval by editing one file on the server and
// refreshing the page — no rebuild required. This is the closest equivalent
// to a ".env you can edit after deploying" for a static Angular build.
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private readonly _config = signal<AppConfig>(FALLBACK_CONFIG);

  readonly config = this._config.asReadonly();

  async load(): Promise<void> {
    try {
      const loaded = await firstValueFrom(this.http.get<AppConfig>('assets/config.json'));
      this._config.set({ ...FALLBACK_CONFIG, ...loaded });
    } catch (err) {
      console.error('[AppConfigService] Failed to load assets/config.json, using fallback config', err);
      this._config.set(FALLBACK_CONFIG);
    }
  }
}
