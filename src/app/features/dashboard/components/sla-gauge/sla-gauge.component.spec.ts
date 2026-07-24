import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SlaGaugeComponent } from './sla-gauge.component';
import { ServiceMetrics } from '../../../../core/models/domain';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { DEFAULT_STATUS_THRESHOLDS } from '../../../../core/policies/status-thresholds.policy';

const metrics: ServiceMetrics = { slaPercent: 94.6, csatScore: 4.6, fcrPercent: 79.8 };

describe('SlaGaugeComponent', () => {
  let fixture: ComponentFixture<SlaGaugeComponent>;
  let component: SlaGaugeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlaGaugeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(SlaGaugeComponent);
    component = fixture.componentInstance;
  });

  it('renders the SLA percentage', () => {
    fixture.componentRef.setInput('metrics', metrics);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('94.6%');
  });

  it('is "normal" severity well above the default warning floor', () => {
    fixture.componentRef.setInput('metrics', metrics); // 94.6%, default warning floor is 80
    fixture.detectChanges();
    expect(component.slaSeverity()).toBe('normal');
  });

  it('is "critical" severity at or below the default critical floor', () => {
    fixture.componentRef.setInput('metrics', { ...metrics, slaPercent: 40 }); // default critical floor is 50
    fixture.detectChanges();
    expect(component.slaSeverity()).toBe('critical');
  });

  it('maps severity to the matching color token', () => {
    fixture.componentRef.setInput('metrics', { ...metrics, slaPercent: 40 });
    fixture.detectChanges();
    expect(component.slaColor()).toBe('var(--color-status-critical)');
  });

  it('uses a runtime-configured threshold instead of the compiled-in default', async () => {
    TestBed.resetTestingModule();
    const customThresholds = {
      ...DEFAULT_STATUS_THRESHOLDS,
      slaPercent: { warning: 99, critical: 97 },
    };
    await TestBed.configureTestingModule({
      imports: [SlaGaugeComponent],
      providers: [
        {
          provide: AppConfigService,
          useValue: { config: () => ({ apiBaseUrl: 'x', pollIntervalMs: 3000, thresholds: customThresholds }) },
        },
      ],
    }).compileComponents();
    const customFixture = TestBed.createComponent(SlaGaugeComponent);
    // 94.6% is "normal" under the default (warning 80/critical 50) but
    // "critical" under the tighter custom override (warning 99/critical 97).
    customFixture.componentRef.setInput('metrics', metrics);
    customFixture.detectChanges();

    expect(customFixture.componentInstance.slaSeverity()).toBe('critical');
  });
});
