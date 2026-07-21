import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, inject } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
// import { provideTransloco } from '@ngneat/transloco';
import { PollingDataSource } from './core/data-access/polling-data-source';
import { DATA_SOURCE } from './core/data-access/data-source.token';
import { AppConfigService } from './core/config/app-config.service';
// import { TranslocoHttpLoader } from './transloco-loader';

// Multi-language support is built (Transloco + en/fa translation files +
// RTL toggle) but intentionally NOT wired into this release. To re-enable:
// 1. Uncomment the two imports above.
// 2. Uncomment the provideTransloco(...) block below.
// 3. In each component that shows user-facing text, restore the
//    `| transloco` pipe usage and TranslocoModule import (see git history /
//    the commented-out originals for exact diffs — the translation keys in
//    src/assets/i18n/en.json and fa.json are unchanged and ready to use).
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    // provideTransloco({
    //   config: {
    //     availableLangs: ['en', 'fa'],
    //     defaultLang: 'en',
    //     reRenderOnLangChange: true,
    //     prodMode: false,
    //   },
    //   loader: TranslocoHttpLoader,
    // }),
    // Loads assets/config.json (apiBaseUrl, pollIntervalMs) before the app
    // renders. This is what makes those two values editable on a deployed
    // server without a rebuild — see CONFIGURATION.md "Runtime config".
    // AppConfigService previously existed but was never provided here, so
    // assets/config.json was silently ignored; BffClientService/
    // PollingDataSource read the compiled-in environment.ts values instead.
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const configService = inject(AppConfigService);
        return () => configService.load();
      },
    },
    // Phase 1: polling. Swap to WebSocketDataSource here in a later phase —
    // no other file in the app needs to change (see README §4/§9).
    { provide: DATA_SOURCE, useClass: PollingDataSource },
  ],
};
