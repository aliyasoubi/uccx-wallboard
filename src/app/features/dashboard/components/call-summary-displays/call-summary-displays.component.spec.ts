import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CallSummaryDisplaysComponent } from './call-summary-displays.component';
import { CallSummary } from '../../../../core/models/domain';

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
    await TestBed.configureTestingModule({ imports: [CallSummaryDisplaysComponent] }).compileComponents();
    fixture = TestBed.createComponent(CallSummaryDisplaysComponent);
    component = fixture.componentInstance;
  });

  it('renders Incoming/Outbound counts from the direction stats, not the org-wide total', () => {
    fixture.componentRef.setInput('summary', summary);
    fixture.componentRef.setInput('inboundStats', { direction: 'inbound', count: 102, topAgentCalls: 28, lowestAgentCalls: 12 });
    fixture.componentRef.setInput('outboundStats', { direction: 'outbound', count: 31, topAgentCalls: 8, lowestAgentCalls: 4 });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('102');
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
});
