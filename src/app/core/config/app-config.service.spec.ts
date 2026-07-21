import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AppConfigService } from './app-config.service';

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

  it('exposes the fallback config before load() resolves', () => {
    expect(service.config().apiBaseUrl).toBe('assets/fixtures');
    expect(service.config().pollIntervalMs).toBe(3000);
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

  it('falls back to the default config if assets/config.json fails to load', async () => {
    spyOn(console, 'error');
    const loadPromise = service.load();
    const req = httpMock.expectOne('assets/config.json');
    req.error(new ProgressEvent('network error'));
    await loadPromise;

    expect(service.config()).toEqual({ apiBaseUrl: 'assets/fixtures', pollIntervalMs: 3000 });
  });
});
