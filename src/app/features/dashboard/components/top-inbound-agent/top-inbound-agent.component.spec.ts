import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopInboundAgentComponent } from './top-inbound-agent.component';
import { Agent, AgentStatus } from '../../../../core/models/domain';

function buildAgent(id: string, name: string, inboundCalls: number, outboundCalls: number): Agent {
  return {
    id,
    name,
    status: AgentStatus.Ready,
    statusDurationSeconds: 0,
    reason: null,
    inboundCalls,
    outboundCalls,
  };
}

describe('TopInboundAgentComponent', () => {
  let fixture: ComponentFixture<TopInboundAgentComponent>;
  let component: TopInboundAgentComponent;

  beforeEach(async () => {
    // Fresh localStorage slate per test so trackers from earlier
    // tests/component instances can't leak into this one.
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TopInboundAgentComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TopInboundAgentComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('labels its column "Inbound" — the card title supplies the "Top Agents" part', () => {
    expect(component.title).toBe('Inbound');
  });

  it('shows the empty state before any agent data arrives', () => {
    fixture.componentRef.setInput('agents', []);
    fixture.detectChanges();
    expect(component.top()).toBeNull();
  });

  it('tracks the agent with the most inbound calls (ignores outbound calls entirely)', () => {
    fixture.componentRef.setInput('agents', [
      buildAgent('A1', 'John', 20, 99),
      buildAgent('A2', 'Sarah', 26, 1),
    ]);
    fixture.detectChanges();
    expect(component.top()).toEqual({ agentId: 'A2', agentName: 'Sarah', value: 26 });
  });

  it('keeps raising the tracked max as agents() input changes over successive polls, never lowering it on a dip', () => {
    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 10, 0)]);
    fixture.detectChanges();
    expect(component.top()?.value).toBe(10);

    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 15, 0)]);
    fixture.detectChanges();
    expect(component.top()?.value).toBe(15);

    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 2, 0)]);
    fixture.detectChanges();
    expect(component.top()?.value).toBe(15);
  });

  it('keeps its tracked state isolated from TopOutboundAgentComponent (separate storage key)', () => {
    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 42, 5)]);
    fixture.detectChanges();
    expect(localStorage.getItem('top-agent-tracker:inbound')).not.toBeNull();
    expect(localStorage.getItem('top-agent-tracker:outbound')).toBeNull();
  });
});
