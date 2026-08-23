import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CallDirectionTotalsComponent } from './call-direction-totals.component';
import { CallDirectionStats } from '../../../../core/models/domain';

const inbound: CallDirectionStats = {
  direction: 'inbound',
  count: 718,
  totalTalkSeconds: 81105, // 22:31:45
  topAgentCalls: 134,
  lowestAgentCalls: 6,
};

const outbound: CallDirectionStats = {
  direction: 'outbound',
  count: 107,
  totalTalkSeconds: 19112, // 5:18:32
  topAgentCalls: 45,
  lowestAgentCalls: 1,
};

describe('CallDirectionTotalsComponent', () => {
  let fixture: ComponentFixture<CallDirectionTotalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallDirectionTotalsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CallDirectionTotalsComponent);
  });

  it('renders all four org-wide totals', () => {
    fixture.componentRef.setInput('inboundStats', inbound);
    fixture.componentRef.setInput('outboundStats', outbound);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Total inbound calls');
    expect(text).toContain('Total outbound calls');
    expect(text).toContain('Total inbound talk time');
    expect(text).toContain('Total outbound talk time');
    expect(fixture.nativeElement.querySelectorAll('app-metric-tile').length).toBe(4);
  });

  it('shows the call counts straight from the direction stats', () => {
    fixture.componentRef.setInput('inboundStats', inbound);
    fixture.componentRef.setInput('outboundStats', outbound);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('718');
    expect(text).toContain('107');
  });

  it('formats talk time as h:mm:ss', () => {
    fixture.componentRef.setInput('inboundStats', inbound);
    fixture.componentRef.setInput('outboundStats', outbound);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('22:31:45');
    expect(text).toContain('5:18:32');
  });

  // The board must never show a fabricated 0 for data it simply doesn't have
  // yet — same rule the SLA/CSAT gauges follow.
  it('shows placeholders, never zeros or NaN, before any data arrives', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('—');
    expect(text).toContain('--:--');
    expect(text).not.toContain('NaN');
  });
});
