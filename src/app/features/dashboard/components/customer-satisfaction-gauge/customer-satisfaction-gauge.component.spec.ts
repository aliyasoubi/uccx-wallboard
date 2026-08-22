import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomerSatisfactionGaugeComponent } from './customer-satisfaction-gauge.component';
import { ServiceMetrics } from '../../../../core/models/domain';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { DEFAULT_STATUS_THRESHOLDS } from '../../../../core/policies/status-thresholds.policy';

const metrics: ServiceMetrics = { slaPercent: 94.6, csatScore: 4.6, fcrPercent: 79.8 };

describe('CustomerSatisfactionGaugeComponent', () => {
  let fixture: ComponentFixture<CustomerSatisfactionGaugeComponent>;
  let component: CustomerSatisfactionGaugeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSatisfactionGaugeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerSatisfactionGaugeComponent);
    component = fixture.componentInstance;
  });

  it('renders the CSAT score to one decimal place', () => {
    fixture.componentRef.setInput('metrics', metrics);
    fixture.detectChanges();
    expect(component.hasData()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('4.6');
  });

  // Regression guard: this gauge used to render `(csatScore ?? 0).toFixed(1)`
  // in normal accent styling, so a missing reading appeared as a real score of
  // "0.0" — indistinguishable from a genuine, catastrophic CSAT of zero. The
  // SLA gauge beside it has always shown an em dash for the same case.
  it('shows the no-data placeholder, never a fabricated 0.0, when the score is missing', () => {
    for (const bad of [null, undefined, NaN]) {
      fixture.componentRef.setInput(
        'metrics',
        bad === null ? null : { ...metrics, csatScore: bad as unknown as number },
      );
      fixture.detectChanges();
      expect(component.hasData()).toBeFalse();
      expect(component.displayValue()).toBe('—');
      expect(component.csatColor()).toBe('var(--color-text-muted)');
      expect(fixture.nativeElement.textContent).not.toContain('0.0');
      expect(fixture.nativeElement.textContent).not.toContain('NaN');
    }
  });

  it('treats a genuine 0.0 score as real data, not as missing', () => {
    fixture.componentRef.setInput('metrics', { ...metrics, csatScore: 0 });
    fixture.detectChanges();
    expect(component.hasData()).toBeTrue();
    expect(component.displayValue()).toBe('0.0');
  });

  // Regression guard: CSAT previously rendered a fixed accent blue no matter
  // the value, so a genuinely poor score looked identical to a great one.
  it('colors a healthy CSAT score with the accent token', () => {
    fixture.componentRef.setInput('metrics', { ...metrics, csatScore: 4.6 }); // above the 4.0 warning floor
    fixture.detectChanges();
    expect(component.csatSeverity()).toBe('normal');
    expect(component.csatColor()).toBe('var(--color-status-accent)');
  });

  it('flags warning severity between the warning and critical floors', () => {
    fixture.componentRef.setInput('metrics', { ...metrics, csatScore: 3.8 }); // default: warning 4.0, critical 3.5
    fixture.detectChanges();
    expect(component.csatSeverity()).toBe('warning');
    expect(component.csatColor()).toBe('var(--color-status-warning)');
  });

  it('flags critical severity at or below the critical floor, including a genuine 0.0', () => {
    for (const score of [3.5, 0]) {
      fixture.componentRef.setInput('metrics', { ...metrics, csatScore: score });
      fixture.detectChanges();
      expect(component.csatSeverity()).toBe('critical');
      expect(component.csatColor()).toBe('var(--color-status-critical)');
    }
  });

  it('uses a runtime-configured CSAT threshold instead of the compiled-in default', async () => {
    TestBed.resetTestingModule();
    const customThresholds = {
      ...DEFAULT_STATUS_THRESHOLDS,
      csatScore: { warning: 4.9, critical: 4.7 },
    };
    await TestBed.configureTestingModule({
      imports: [CustomerSatisfactionGaugeComponent],
      providers: [
        {
          provide: AppConfigService,
          useValue: {
            config: () => ({ apiBaseUrl: 'x', pollIntervalMs: 3000, thresholds: customThresholds }),
          },
        },
      ],
    }).compileComponents();
    const customFixture = TestBed.createComponent(CustomerSatisfactionGaugeComponent);
    // 4.6 is "normal" under the default (warning 4.0) but "critical" under
    // the tighter custom override (critical floor 4.7).
    customFixture.componentRef.setInput('metrics', metrics);
    customFixture.detectChanges();

    expect(customFixture.componentInstance.csatSeverity()).toBe('critical');
  });
});
