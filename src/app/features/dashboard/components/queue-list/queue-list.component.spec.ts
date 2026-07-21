import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueueListComponent } from './queue-list.component';
import { Queue } from '../../../../core/models/domain';

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

describe('QueueListComponent', () => {
  let fixture: ComponentFixture<QueueListComponent>;
  let component: QueueListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [QueueListComponent] }).compileComponents();
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
    expect(fixture.nativeElement.textContent).toContain('No queues');
  });

  it('renders one row per queue for every queue passed in, not just the first', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', [
      buildQueue({ name: 'Sales' }),
      buildQueue({ name: 'Support' }),
      buildQueue({ name: 'Billing' }),
    ]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Sales');
    expect(text).toContain('Support');
    expect(text).toContain('Billing');
  });

  it('shows the waiting-side columns (Inbound/In queue/Abandons/CWD/MAD/SLA) for the waiting variant', () => {
    fixture.componentRef.setInput('variant', 'waiting');
    fixture.componentRef.setInput('queues', [buildQueue()]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Inbound');
    expect(text).toContain('In queue');
    expect(text).toContain('Abandons');
    expect(text).toContain('CWD');
    expect(text).toContain('MAD');
    expect(text).toContain('SLA');
    expect(text).not.toContain('Handled');
  });

  it('shows the serving-side columns (Handled/ACT/Ready) for the serving variant', () => {
    fixture.componentRef.setInput('variant', 'serving');
    fixture.componentRef.setInput('queues', [buildQueue()]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Handled');
    expect(text).toContain('ACT');
    expect(text).toContain('Ready');
    expect(text).not.toContain('Abandons');
  });

  it('computes per-row severities from the shared status-thresholds policy', () => {
    const critical = buildQueue({ totalCalls: 100, abandonedCalls: 20, currentWaitSeconds: 200, slaPercent: 10 });
    const sev = component.severityFor(critical);
    expect(sev.abandoned).toBe('critical');
    expect(sev.currentWait).toBe('critical');
    expect(sev.sla).toBe('critical');
  });
});
