import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { KpiMetricsComponent } from './kpi-metrics.component';
import { CallSummary, ServiceMetrics } from '../../../../core/models/domain';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { DEFAULT_STATUS_THRESHOLDS } from '../../../../core/policies/status-thresholds.policy';

const summary: CallSummary = {
  totalCalls: 500,
  handledCalls: 483,
  abandonedCalls: 17,
  avgWaitSeconds: 20,
  avgTalkSeconds: 100,
  callsWaiting: 1,
};

const serviceMetrics: ServiceMetrics = { slaPercent: 94, csatScore: 4.5, fcrPercent: 85 };

describe('KpiMetricsComponent', () => {
  let fixture: ComponentFixture<KpiMetricsComponent>;
  let component: KpiMetricsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiMetricsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(KpiMetricsComponent);
    component = fixture.componentInstance;
  });

  it('renders FCR, AWD, and AHT', () => {
    fixture.componentRef.setInput('summary', summary);
    fixture.componentRef.setInput('serviceMetrics', serviceMetrics);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('FCR');
    expect(text).toContain('AWD');
    expect(text).toContain('AHT');
  });

  // Guards the current, deliberate state (see the component's header
  // comment) — the tile is intentionally hidden, not accidentally dead
  // code. If this test starts failing because the tile is wanted back,
  // that's a one-line template change (callsWaitingSeverity is still
  // computed below), not a sign something broke.
  it('does not render Calls in queue while it is deliberately hidden', () => {
    fixture.componentRef.setInput('summary', summary);
    fixture.componentRef.setInput('serviceMetrics', serviceMetrics);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Calls in queue');
  });

  it('flags AWD/AHT/calls-waiting severity using the default thresholds when no summary is set', () => {
    fixture.componentRef.setInput('summary', null);
    fixture.componentRef.setInput('serviceMetrics', null);
    fixture.detectChanges();
    // 0 is below every "higher is worse" warning threshold — all normal.
    expect(component.awdSeverity()).toBe('normal');
    expect(component.ahtSeverity()).toBe('normal');
    expect(component.callsWaitingSeverity()).toBe('normal');
    // fcrPercent defaults to 100 when unset — above every floor, normal.
    expect(component.fcrSeverity()).toBe('normal');
  });

  it('flags critical severity once a value crosses the default critical threshold', () => {
    fixture.componentRef.setInput(
      'summary',
      { ...summary, avgWaitSeconds: 90, avgTalkSeconds: 200, callsWaiting: 10 },
    );
    fixture.componentRef.setInput('serviceMetrics', { ...serviceMetrics, fcrPercent: 40 });
    fixture.detectChanges();
    expect(component.awdSeverity()).toBe('critical');
    expect(component.ahtSeverity()).toBe('critical');
    expect(component.callsWaitingSeverity()).toBe('critical');
    expect(component.fcrSeverity()).toBe('critical');
  });

  it('uses a runtime-configured threshold instead of the compiled-in default', async () => {
    TestBed.resetTestingModule();
    const customThresholds = {
      ...DEFAULT_STATUS_THRESHOLDS,
      avgWaitSeconds: { warning: 10, critical: 15 },
    };
    await TestBed.configureTestingModule({
      imports: [KpiMetricsComponent],
      providers: [
        {
          provide: AppConfigService,
          useValue: { config: () => ({ apiBaseUrl: 'x', pollIntervalMs: 3000, thresholds: customThresholds }) },
        },
      ],
    }).compileComponents();
    const customFixture = TestBed.createComponent(KpiMetricsComponent);
    // 20s AWD is "normal" under the default (warning 30/critical 60) but
    // "critical" under the tighter custom override (warning 10/critical 15).
    customFixture.componentRef.setInput('summary', { ...summary, avgWaitSeconds: 20 });
    customFixture.detectChanges();

    expect(customFixture.componentInstance.awdSeverity()).toBe('critical');
  });
});
