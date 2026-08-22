import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AgentSummaryComponent } from './agent-summary.component';
import { Agent, AgentStatus } from '../../../../core/models/domain';

function buildAgents(count: number): Agent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `A${i + 1}`,
    name: `Agent ${i + 1}`,
    status: AgentStatus.Ready,
    statusDurationSeconds: 60 * (i + 1),
    reason: null,
    inboundCalls: 0,
    outboundCalls: 0,
  }));
}

describe('AgentSummaryComponent', () => {
  let fixture: ComponentFixture<AgentSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AgentSummaryComponent] }).compileComponents();
    fixture = TestBed.createComponent(AgentSummaryComponent);
  });

  it('shows the empty state when there are no agents', () => {
    fixture.componentRef.setInput('agents', []);
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('.row'));
    expect(rows.length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No activity');
  });

  // This is the direct regression test for the reported "only the first
  // list item works" symptom: every agent in the input array must render
  // as its own row, not just the first.
  it('renders a row for every agent, not just the first', () => {
    const agents = buildAgents(5);
    fixture.componentRef.setInput('agents', agents);
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.row'));
    expect(rows.length).toBe(5);

    const renderedNames = rows.map((row) =>
      row.query(By.css('.name')).nativeElement.textContent.trim(),
    );
    expect(renderedNames).toEqual(['Agent 1', 'Agent 2', 'Agent 3', 'Agent 4', 'Agent 5']);
  });

  it('renders each row´s own duration and status, not a copy of the first row', () => {
    const agents = buildAgents(3);
    fixture.componentRef.setInput('agents', agents);
    fixture.detectChanges();

    const durations = fixture.debugElement
      .queryAll(By.css('.duration'))
      .map((el) => el.nativeElement.textContent.trim());

    // 60s, 120s, 180s -> "1:00", "2:00", "3:00" — three distinct values,
    // proving each row is bound to its own agent rather than all rows
    // rendering the first agent's data.
    expect(durations).toEqual(['1:00', '2:00', '3:00']);
  });

  it('updates the online count to match the full agent list', () => {
    fixture.componentRef.setInput('agents', buildAgents(4));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('4 agents online');
  });

  it('re-renders all rows again after the agents input changes (no stale first-row-only cache)', () => {
    fixture.componentRef.setInput('agents', buildAgents(2));
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.row')).length).toBe(2);

    fixture.componentRef.setInput('agents', buildAgents(6));
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.row')).length).toBe(6);
  });
});
