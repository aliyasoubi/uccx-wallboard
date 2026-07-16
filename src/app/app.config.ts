import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTransloco } from '@ngneat/transloco';
import { PollingDataSource } from './core/data-access/polling-data-source';
import { DATA_SOURCE } from './core/data-access/data-source.token';
import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'fa'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: false,
      },
      loader: TranslocoHttpLoader,
    }),
    // Phase 1: polling. Swap to WebSocketDataSource here in a later phase —
    // no other file in the app needs to change (see README §4/§9).
    { provide: DATA_SOURCE, useClass: PollingDataSource },
  ],
};
