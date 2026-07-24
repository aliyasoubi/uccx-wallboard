import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { QueueListComponent } from './queue-list.component';
import { Queue } from '../../../../core/models/domain';
import { AppConfigService } from '../../../../core/config/app-config.service';
import { DEFAULT_STATUS_THRESHOLDS } from '../../../../core/policies/status-thresholds.policy';

function buildQueue(overrides: Partial<Queue> = {}): Queue {
  return {
    name: 'Sales',
    totalCalls: 210,
    handledCalls: 205,
    abandonedCalls: 5,
    avgWaitSeconds: 32,
    callsWaiting: 2,
    agentStates: { total: 12, ready: 5, talking: 4, notReady: 3 },
    currentWaitSeconds: 28,
    maxAbandonSeconds: 74,
    avgHandleSeconds: 292,
    slaPercent: 96.1,
    ...overrides,
  };
}

const ALL_NINE_LABELS = ['Inbound', 'Handled', 'In queue', 'Abandons', 'CWD', 'MAD', 'ACT', 'Ready', 'SLA'];

describe('QueueListComponent', () => {
  let fixture: ComponentFixture<QueueListComponent>;
  let component: QueueListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueueListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(QueueListComponent);
    component = fixture.componentInstance;
  });

  it('titles the panel "Waiting Queue" for the waiting variant', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', []);
    fixture.detectChanges();
    expect(component.title()).toBe('Waiting Queue');
  });

  it('titles the panel "Serving Queue" for the serving variant', () => {
    fixture.componentRef.setInput('variant', 'serving');
    fixture.componentRef.setInput('queues', []);
    fixture.detectChanges();
    expect(component.title()).toBe('Serving Queue');
  });

  it('shows the empty state when there are no queues', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No data');
  });

  it('does not render individual queue names (Sales/Support/Billing) — aggregated view only', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', [
      buildQueue({ name: 'Sales' }),
      buildQueue({ name: 'Support' }),
      buildQueue({ name: 'Billing' }),
    ]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Sales');
    expect(text).not.toContain('Support');
    expect(text).not.toContain('Billing');
  });

  it('includes all nine required parameters for the waiting variant', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', [buildQueue()]);
    fixture.detectChanges();
    expect(component.stats().map((s) => s.label)).toEqual(ALL_NINE_LABELS);
  });

  it('includes all nine required parameters for the serving variant too (full parity, not a subset)', () => {
    fixture.componentRef.setInput('variant', 'serving');
    fixture.componentRef.setInput('queues', [buildQueue()]);
    fixture.detectChanges();
    expect(component.stats().map((s) => s.label)).toEqual(ALL_NINE_LABELS);
  });

  it('sums the additive counts (Inbound/Handled/In queue/Abandons/Ready) across all queues', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', [
      buildQueue({ totalCalls: 210, handledCalls: 205, callsWaiting: 2, abandonedCalls: 5, agentStates: { total: 12, ready: 5, talking: 4, notReady: 3 } }),
      buildQueue({ totalCalls: 190, handledCalls: 182, callsWaiting: 3, abandonedCalls: 8, agentStates: { total: 15, ready: 6, talking: 7, notReady: 2 } }),
    ]);
    fixture.detectChanges();
    const byLabel = Object.fromEntries(component.stats().map((s) => [s.label, s.value]));
    expect(byLabel['Inbound']).toBe('400');
    expect(byLabel['Handled']).toBe('387');
    expect(byLabel['In queue']).toBe('5');
    expect(byLabel['Abandons']).toBe('13');
    expect(byLabel['Ready']).toBe('11');
  });

  it('takes the MAX (not sum or average) across queues for CWD and MAD', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', [
      buildQueue({ currentWaitSeconds: 28, maxAbandonSeconds: 74 }),
      buildQueue({ currentWaitSeconds: 61, maxAbandonSeconds: 133 }),
      buildQueue({ currentWaitSeconds: 19, maxAbandonSeconds: 102 }),
    ]);
    fixture.detectChanges();
    const byLabel = Object.fromEntries(component.stats().map((s) => [s.label, s.value]));
    expect(byLabel['CWD']).toBe('1:01'); // max of 28, 61, 19
    expect(byLabel['MAD']).toBe('2:13'); // max of 74, 133, 102
  });

  it('takes a call-volume-weighted average (not a plain average) across queues for ACT and SLA', () => {
    fixture.componentRef.setInput('variant', 'serving');
    fixture.componentRef.setInput('queues', [
      buildQueue({ handledCalls: 900, avgHandleSeconds: 100, totalCalls: 900, slaPercent: 90 }),
      buildQueue({ handledCalls: 100, avgHandleSeconds: 500, totalCalls: 100, slaPercent: 50 }),
    ]);
    fixture.detectChanges();
    const byLabel = Object.fromEntries(component.stats().map((s) => [s.label, s.value]));
    // Weighted: (900*100 + 100*500) / 1000 = 140s = "2:20" — not the plain
    // average of 100 and 500 (which would be 300s / "5:00").
    expect(byLabel['ACT']).toBe('2:20');
    // Weighted: (900*90 + 100*50) / 1000 = 86.0% — not the plain average (70%).
    expect(byLabel['SLA']).toBe('86.0%');
  });

  it('flags Abandons/CWD/SLA severity from the shared status-thresholds policy, computed on the aggregate', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', [
      buildQueue({ totalCalls: 100, abandonedCalls: 20, currentWaitSeconds: 200, slaPercent: 10, handledCalls: 80 }),
    ]);
    fixture.detectChanges();
    const byLabel = Object.fromEntries(component.stats().map((s) => [s.label, s.severity]));
    expect(byLabel['Abandons']).toBe('critical');
    expect(byLabel['CWD']).toBe('critical');
    expect(byLabel['SLA']).toBe('critical');
  });

  it('never causes horizontal overflow: renders as a single-column list of rows, not a multi-column grid', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', [buildQueue()]);
    fixture.detectChanges();
    const list: HTMLElement = fixture.nativeElement.querySelector('.stat-list');
    expect(list.children.length).toBe(9);
    expect(getComputedStyle(list).flexDirection).toBe('column');
  });

  it('does not divide by zero when queues is empty (guarded by the empty state, but the math must be safe)', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', []);
    fixture.detectChanges();
    expect(() => component.stats()).not.toThrow();
  });

  it('uses a runtime-configured threshold instead of the compiled-in default', async () => {
    TestBed.resetTestingModule();
    const customThresholds = {
      ...DEFAULT_STATUS_THRESHOLDS,
      slaPercent: { warning: 99, critical: 97 },
    };
    await TestBed.configureTestingModule({
      imports: [QueueListComponent],
      providers: [
        {
          provide: AppConfigService,
          useValue: { config: () => ({ apiBaseUrl: 'x', pollIntervalMs: 3000, thresholds: customThresholds }) },
        },
      ],
    }).compileComponents();
    const customFixture = TestBed.createComponent(QueueListComponent);
    customFixture.componentRef.setInput('variant', 'waiting');
    // 96.1% SLA is "normal" under the default (warning 80/critical 50) but
    // "critical" under the tighter custom override (warning 99/critical 97).
    customFixture.componentRef.setInput('queues', [buildQueue({ slaPercent: 96.1, totalCalls: 100 })]);
    customFixture.detectChanges();

    const byLabel = Object.fromEntries(
      customFixture.componentInstance.stats().map((s) => [s.label, s.severity]),
    );
    expect(byLabel['SLA']).toBe('critical');
  });
});
