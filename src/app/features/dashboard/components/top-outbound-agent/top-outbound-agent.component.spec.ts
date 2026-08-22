import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopOutboundAgentComponent } from './top-outbound-agent.component';
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

describe('TopOutboundAgentComponent', () => {
  let fixture: ComponentFixture<TopOutboundAgentComponent>;
  let component: TopOutboundAgentComponent;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TopOutboundAgentComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TopOutboundAgentComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('titles the panel "Top Outbound Agent"', () => {
    expect(component.title).toBe('Top Outbound Agent');
  });

  it('shows the empty state before any agent data arrives', () => {
    fixture.componentRef.setInput('agents', []);
    fixture.detectChanges();
    expect(component.top()).toBeNull();
  });

  it('tracks the agent with the most outbound calls (ignores inbound calls entirely)', () => {
    fixture.componentRef.setInput('agents', [
      buildAgent('A1', 'John', 20, 9),
      buildAgent('A2', 'Sarah', 26, 1),
    ]);
    fixture.detectChanges();
    expect(component.top()).toEqual({ agentId: 'A1', agentName: 'John', value: 9 });
  });

  it('keeps raising the tracked max as agents() input changes over successive polls, never lowering it on a dip', () => {
    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 0, 10)]);
    fixture.detectChanges();
    expect(component.top()?.value).toBe(10);

    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 0, 15)]);
    fixture.detectChanges();
    expect(component.top()?.value).toBe(15);

    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 0, 2)]);
    fixture.detectChanges();
    expect(component.top()?.value).toBe(15);
  });

  it('keeps its tracked state isolated from TopInboundAgentComponent (separate storage key)', () => {
    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 5, 42)]);
    fixture.detectChanges();
    expect(localStorage.getItem('top-agent-tracker:outbound')).not.toBeNull();
    expect(localStorage.getItem('top-agent-tracker:inbound')).toBeNull();
  });
});
