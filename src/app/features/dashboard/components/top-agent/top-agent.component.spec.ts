import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopAgentComponent } from './top-agent.component';
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

describe('TopAgentComponent', () => {
  let fixture: ComponentFixture<TopAgentComponent>;
  let component: TopAgentComponent;

  beforeEach(async () => {
    // Each test gets a fresh localStorage slate so trackers from earlier
    // tests/component instances can't leak into this one.
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [TopAgentComponent] }).compileComponents();
    fixture = TestBed.createComponent(TopAgentComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('shows the empty state before any agent data arrives', () => {
    fixture.componentRef.setInput('direction', 'inbound');
    fixture.componentRef.setInput('agents', []);
    fixture.detectChanges();
    expect(component.top()).toBeNull();
  });

  it('tracks the agent with the most inbound calls when direction="inbound"', () => {
    fixture.componentRef.setInput('direction', 'inbound');
    fixture.componentRef.setInput(
      'agents',
      [buildAgent('A1', 'John', 20, 99), buildAgent('A2', 'Sarah', 26, 1)],
    );
    fixture.detectChanges();
    expect(component.top()).toEqual({ agentId: 'A2', agentName: 'Sarah', value: 26 });
  });

  it('tracks the agent with the most outbound calls when direction="outbound"', () => {
    fixture.componentRef.setInput('direction', 'outbound');
    fixture.componentRef.setInput(
      'agents',
      [buildAgent('A1', 'John', 20, 9), buildAgent('A2', 'Sarah', 26, 1)],
    );
    fixture.detectChanges();
    expect(component.top()).toEqual({ agentId: 'A1', agentName: 'John', value: 9 });
  });

  it('sets the panel title based on direction', () => {
    fixture.componentRef.setInput('direction', 'inbound');
    fixture.componentRef.setInput('agents', []);
    fixture.detectChanges();
    expect(component.title()).toBe('Top Inbound Agent');

    fixture.componentRef.setInput('direction', 'outbound');
    fixture.detectChanges();
    expect(component.title()).toBe('Top Outbound Agent');
  });

  it('keeps raising the tracked max as agents() input changes over successive polls', () => {
    fixture.componentRef.setInput('direction', 'inbound');
    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 10, 0)]);
    fixture.detectChanges();
    expect(component.top()?.value).toBe(10);

    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 15, 0)]);
    fixture.detectChanges();
    expect(component.top()?.value).toBe(15);

    // A dip must not lower the tracked max.
    fixture.componentRef.setInput('agents', [buildAgent('A1', 'John', 2, 0)]);
    fixture.detectChanges();
    expect(component.top()?.value).toBe(15);
  });
});
