import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TopAgentsComponent } from './top-agents.component';
import { Agent, AgentStatus } from '../../../../core/models/domain';

function buildAgent(id: string, name: string, inbound: number, outbound: number): Agent {
  return {
    id,
    name,
    status: AgentStatus.Ready,
    statusDurationSeconds: 0,
    reason: null,
    inboundCalls: inbound,
    outboundCalls: outbound,
  };
}

describe('TopAgentsComponent', () => {
  let fixture: ComponentFixture<TopAgentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TopAgentsComponent] }).compileComponents();
    fixture = TestBed.createComponent(TopAgentsComponent);
  });

  it('renders one shared card with both direction columns inside it', () => {
    fixture.detectChanges();
    // One card, not two — this is the whole point of the wrapper. The
    // children contribute .direction-column, never their own .panel card.
    expect(fixture.debugElement.queryAll(By.css('.panel')).length).toBe(1);
    expect(fixture.debugElement.queryAll(By.css('.direction-column')).length).toBe(2);
    expect(fixture.debugElement.query(By.css('app-top-inbound-agent'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('app-top-outbound-agent'))).not.toBeNull();
  });

  it('shows the shared card title, with each column labelled by direction only', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    // The card says "Top Agents" once; the columns say only which direction
    // they are. "Top Inbound Agent" per column would repeat it three times.
    expect(text).toContain('Top Agents');
    expect(text).toContain('Inbound');
    expect(text).toContain('Outbound');
    expect(text).not.toContain('Top Inbound Agent');
    expect(text).not.toContain('Top Outbound Agent');
  });

  it('passes the roster through to both children', () => {
    fixture.componentRef.setInput('agents', [
      buildAgent('A1', 'John Smith', 30, 4),
      buildAgent('A2', 'Sarah Johnson', 12, 19),
    ]);
    fixture.detectChanges();
    // Second pass: each child's tracker populates `top` from an effect, so
    // the first pass renders the empty state and the second the real values.
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    // Top inbound is John (30), top outbound is Sarah (19).
    expect(text).toContain('John Smith');
    expect(text).toContain('Sarah Johnson');
    expect(text).toContain('30');
    expect(text).toContain('19');
  });
});
