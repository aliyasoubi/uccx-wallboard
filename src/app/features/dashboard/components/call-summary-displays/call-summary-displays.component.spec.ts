import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CallSummaryDisplaysComponent } from './call-summary-displays.component';
import { CallSummary } from '../../../../core/models/domain';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { DEFAULT_STATUS_THRESHOLDS } from '../../../../core/policies/status-thresholds.policy';

describe('CallSummaryDisplaysComponent', () => {
  let fixture: ComponentFixture<CallSummaryDisplaysComponent>;
  let component: CallSummaryDisplaysComponent;

  const summary: CallSummary = {
    totalCalls: 500,
    handledCalls: 483,
    abandonedCalls: 17,
    avgWaitSeconds: 48,
    avgTalkSeconds: 312,
    callsWaiting: 6,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallSummaryDisplaysComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CallSummaryDisplaysComponent);
    component = fixture.componentInstance;
  });

  it('renders Incoming from the org-wide summary total and Outbound from the direction stats', () => {
    fixture.componentRef.setInput('summary', summary);
    fixture.componentRef.setInput('inboundStats', { direction: 'inbound', count: 102, topAgentCalls: 28, lowestAgentCalls: 12 });
    fixture.componentRef.setInput('outboundStats', { direction: 'outbound', count: 31, topAgentCalls: 8, lowestAgentCalls: 4 });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('500');
    expect(text).toContain('31');
  });

  it('renders Answered as handledCalls and Abandoned as abandonedCalls', () => {
    fixture.componentRef.setInput('summary', summary);
    fixture.componentRef.setInput('inboundStats', null);
    fixture.componentRef.setInput('outboundStats', null);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('483');
    expect(text).toContain('17');
  });

  it('flags abandoned severity once the abandon ratio crosses the critical threshold', () => {
    fixture.componentRef.setInput('summary', { ...summary, totalCalls: 100, abandonedCalls: 15 });
    fixture.detectChanges();
    expect(component.abandonedSeverity()).toBe('critical');
  });

  it('falls back to "normal" severity when there is no summary yet', () => {
    fixture.componentRef.setInput('summary', null);
    fixture.detectChanges();
    expect(component.abandonedSeverity()).toBe('normal');
  });

  // The whole point of runtime-configurable thresholds: a value that the
  // DEFAULT threshold would call "normal" must flip to "critical" once a
  // custom (tighter) threshold is loaded via AppConfigService — proving
  // the component reads the live config, not the compile-time default.
  it('uses a runtime-configured threshold instead of the compiled-in default', async () => {
    TestBed.resetTestingModule();
    const customThresholds = {
      ...DEFAULT_STATUS_THRESHOLDS,
      abandonedRatio: { warning: 0.01, critical: 0.02 },
    };
    await TestBed.configureTestingModule({
      imports: [CallSummaryDisplaysComponent],
      providers: [
        {
          provide: AppConfigService,
          useValue: { config: () => ({ apiBaseUrl: 'x', pollIntervalMs: 3000, thresholds: customThresholds }) },
        },
      ],
    }).compileComponents();
    const customFixture = TestBed.createComponent(CallSummaryDisplaysComponent);
    customFixture.componentRef.setInput('summary', { ...summary, totalCalls: 100, abandonedCalls: 3 }); // 3%
    customFixture.detectChanges();

    // Under DEFAULT_STATUS_THRESHOLDS (warning 5%/critical 10%), 3% is "normal".
    // Under the custom override above (warning 1%/critical 2%), 3% is "critical".
    expect(customFixture.componentInstance.abandonedSeverity()).toBe('critical');
  });

  it('gives each of the four tiles its related icon, each with a distinct color', () => {
    fixture.componentRef.setInput('summary', summary);
    fixture.componentRef.setInput('inboundStats', null);
    fixture.componentRef.setInput('outboundStats', null);
    fixture.detectChanges();
    const el = fixture.nativeElement;

    const incoming: HTMLElement = el.querySelector('i.ti-phone-incoming');
    const outgoing: HTMLElement = el.querySelector('i.ti-phone-outgoing');
    const answered: HTMLElement = el.querySelector('i.ti-phone-check');
    const abandoned: HTMLElement = el.querySelector('i.ti-phone-x');

    expect(incoming).not.toBeNull();
    expect(outgoing).not.toBeNull();
    expect(answered).not.toBeNull();
    expect(abandoned).not.toBeNull();

    const colors = [incoming.style.color, outgoing.style.color, answered.style.color, abandoned.style.color];
    expect(new Set(colors).size).toBe(4); // all four distinct
  });
});
