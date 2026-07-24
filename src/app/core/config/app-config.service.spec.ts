import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AppConfigService } from './app-config.service';
import { DEFAULT_STATUS_THRESHOLDS } from '../policies/status-thresholds.policy';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exposes the fallback config, including default thresholds, before load() resolves', () => {
    expect(service.config().apiBaseUrl).toBe('assets/fixtures');
    expect(service.config().pollIntervalMs).toBe(3000);
    expect(service.config().thresholds).toEqual(DEFAULT_STATUS_THRESHOLDS);
  });

  it('loads and applies assets/config.json', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('assets/config.json');
    expect(req.request.method).toBe('GET');
    req.flush({ apiBaseUrl: 'https://cccx-bff.example.com/api', pollIntervalMs: 5000 });
    await loadPromise;

    expect(service.config().apiBaseUrl).toBe('https://cccx-bff.example.com/api');
    expect(service.config().pollIntervalMs).toBe(5000);
  });

  it('falls back to the default config (including default thresholds) if assets/config.json fails to load', async () => {
    spyOn(console, 'error');
    const loadPromise = service.load();
    const req = httpMock.expectOne('assets/config.json');
    req.error(new ProgressEvent('network error'));
    await loadPromise;

    expect(service.config()).toEqual({
      apiBaseUrl: 'assets/fixtures',
      pollIntervalMs: 3000,
      thresholds: DEFAULT_STATUS_THRESHOLDS,
    });
  });

  it('applies a fully-specified thresholds block from assets/config.json', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('assets/config.json');
    req.flush({
      thresholds: {
        slaPercent: { warning: 90, critical: 70 },
      },
    });
    await loadPromise;

    expect(service.config().thresholds.slaPercent).toEqual({ warning: 90, critical: 70 });
  });

  // This is the important case: a config.json that only overrides ONE
  // threshold metric must not wipe out the defaults for every other
  // metric. A naive `{...FALLBACK_CONFIG, ...loaded}` shallow spread would
  // replace the entire `thresholds` object with just `{ slaPercent: ... }`,
  // silently dropping avgWaitSeconds/currentWaitSeconds/etc.
  it('merges a partial thresholds override with the defaults, one level deep, instead of replacing the whole block', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('assets/config.json');
    req.flush({
      thresholds: {
        slaPercent: { warning: 90, critical: 70 },
      },
    });
    await loadPromise;

    const thresholds = service.config().thresholds;
    expect(thresholds.slaPercent).toEqual({ warning: 90, critical: 70 });
    // Everything else must still be the untouched default.
    expect(thresholds.avgWaitSeconds).toEqual(DEFAULT_STATUS_THRESHOLDS.avgWaitSeconds);
    expect(thresholds.currentWaitSeconds).toEqual(DEFAULT_STATUS_THRESHOLDS.currentWaitSeconds);
    expect(thresholds.abandonedRatio).toEqual(DEFAULT_STATUS_THRESHOLDS.abandonedRatio);
    expect(thresholds.avgTalkSeconds).toEqual(DEFAULT_STATUS_THRESHOLDS.avgTalkSeconds);
    expect(thresholds.callsWaiting).toEqual(DEFAULT_STATUS_THRESHOLDS.callsWaiting);
    expect(thresholds.notReadyRatio).toEqual(DEFAULT_STATUS_THRESHOLDS.notReadyRatio);
    expect(thresholds.fcrPercent).toEqual(DEFAULT_STATUS_THRESHOLDS.fcrPercent);
  });

  it('uses the full default thresholds block when assets/config.json omits thresholds entirely', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('assets/config.json');
    req.flush({ apiBaseUrl: 'https://example.com/api' });
    await loadPromise;

    expect(service.config().thresholds).toEqual(DEFAULT_STATUS_THRESHOLDS);
  });
});
