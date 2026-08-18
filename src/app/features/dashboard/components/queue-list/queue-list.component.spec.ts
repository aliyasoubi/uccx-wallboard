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
    maxWaitSeconds: 74,
    avgTalkSeconds: 292,
    slaPercent: 96.1,
    ...overrides,
  };
}

const ALL_NINE_LABELS = [
  'Inbound',
  'Handled',
  'In queue',
  'Abandons',
  'Current wait',
  'Longest wait',
  'AVG Talk Time',
  'Ready',
  'SLA',
];

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

  it('titles the panel with the queue name', () => {
    fixture.componentRef.setInput('queue', buildQueue({ name: 'Sales' }));
    fixture.detectChanges();
    expect(component.title()).toBe('Sales');
  });

  it('titles the panel with an empty string when no queue is set', () => {
    fixture.detectChanges();
    expect(component.title()).toBe('');
  });

  it('includes all nine required parameters for a single queue', () => {
    fixture.componentRef.setInput('queue', buildQueue());
    fixture.detectChanges();
    expect(component.stats().map((s) => s.label)).toEqual(ALL_NINE_LABELS);
  });

  it('renders each stat straight from the single queue input, unaggregated', () => {
    fixture.componentRef.setInput(
      'queue',
      buildQueue({
        totalCalls: 210,
        handledCalls: 205,
        callsWaiting: 2,
        abandonedCalls: 5,
        agentStates: { total: 12, ready: 5, talking: 4, notReady: 3 },
      }),
    );
    fixture.detectChanges();
    const byLabel = Object.fromEntries(component.stats().map((s) => [s.label, s.value]));
    expect(byLabel['Inbound']).toBe('210');
    expect(byLabel['Handled']).toBe('205 (98%)');
    expect(byLabel['In queue']).toBe('2');
    expect(byLabel['Abandons']).toBe('5');
    expect(byLabel['Ready']).toBe('5');
  });

  it('formats Current wait and Longest wait durations straight from the queue', () => {
    fixture.componentRef.setInput('queue', buildQueue({ currentWaitSeconds: 61, maxWaitSeconds: 133 }));
    fixture.detectChanges();
    const byLabel = Object.fromEntries(component.stats().map((s) => [s.label, s.value]));
    expect(byLabel['Current wait']).toBe('1:01');
    expect(byLabel['Longest wait']).toBe('2:13');
  });

  // Regression guard for the "Max WD NaN:NaN" bug: the component used to
  // carry its own copy of the duration arithmetic without the shared pipe's
  // null/NaN guard, so any absent backend field rendered as "NaN:NaN" on the
  // wallboard. Durations now go through formatDurationSeconds, which
  // degrades to the placeholder instead.
  it('renders the placeholder, never NaN:NaN, when a duration is missing from the payload', () => {
    fixture.componentRef.setInput(
      'queue',
      // Casts model a backend payload that omits these fields entirely — the
      // exact shape that produced NaN:NaN before the shared guard was used.
      buildQueue({
        currentWaitSeconds: undefined as unknown as number,
        maxWaitSeconds: undefined as unknown as number,
        avgTalkSeconds: NaN,
      }),
    );
    fixture.detectChanges();
    const byLabel = Object.fromEntries(component.stats().map((s) => [s.label, s.value]));
    expect(byLabel['Current wait']).toBe('--:--');
    expect(byLabel['Longest wait']).toBe('--:--');
    expect(byLabel['AVG Talk Time']).toBe('--:--');
    expect(fixture.nativeElement.textContent).not.toContain('NaN');
  });

  it('shows a placeholder percentage instead of NaN% for a queue that has taken no calls', () => {
    fixture.componentRef.setInput('queue', buildQueue({ totalCalls: 0, handledCalls: 0 }));
    fixture.detectChanges();
    const byLabel = Object.fromEntries(component.stats().map((s) => [s.label, s.value]));
    expect(byLabel['Handled']).toBe('0 (--%)');
    expect(fixture.nativeElement.textContent).not.toContain('NaN');
  });

  it('flags Abandons/Current wait/SLA severity from the shared status-thresholds policy', () => {
    fixture.componentRef.setInput(
      'queue',
      buildQueue({ totalCalls: 100, abandonedCalls: 20, currentWaitSeconds: 200, slaPercent: 10, handledCalls: 80 }),
    );
    fixture.detectChanges();
    const byLabel = Object.fromEntries(component.stats().map((s) => [s.label, s.severity]));
    expect(byLabel['Abandons']).toBe('critical');
    expect(byLabel['Current wait']).toBe('critical');
    expect(byLabel['SLA']).toBe('critical');
  });

  it('never causes horizontal overflow: renders as a single-column list of rows, not a multi-column grid', () => {
    fixture.componentRef.setInput('queue', buildQueue());
    fixture.detectChanges();
    const list: HTMLElement = fixture.nativeElement.querySelector('.stat-list');
    expect(list.children.length).toBe(9);
    expect(getComputedStyle(list).flexDirection).toBe('column');
  });

  it('does not throw and returns no stats when no queue is set', () => {
    fixture.detectChanges();
    expect(() => component.stats()).not.toThrow();
    expect(component.stats()).toEqual([]);
  });

  it('shows the "No data" empty state when no queue is set', () => {
    fixture.detectChanges();
    expect(component.hasData()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('No data');
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
    // 96.1% SLA is "normal" under the default (warning 80/critical 50) but
    // "critical" under the tighter custom override (warning 99/critical 97).
    customFixture.componentRef.setInput('queue', buildQueue({ slaPercent: 96.1, totalCalls: 100 }));
    customFixture.detectChanges();

    const byLabel = Object.fromEntries(
      customFixture.componentInstance.stats().map((s) => [s.label, s.severity]),
    );
    expect(byLabel['SLA']).toBe('critical');
  });
});
