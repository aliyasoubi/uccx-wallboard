import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentStateDonutComponent } from './agent-state-donut.component';

describe('AgentStateDonutComponent', () => {
  let fixture: ComponentFixture<AgentStateDonutComponent>;
  let component: AgentStateDonutComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentStateDonutComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AgentStateDonutComponent);
    component = fixture.componentInstance;
  });

  it('reports total as the literal sum of ready + talking + notReady', () => {
    fixture.componentRef.setInput('summary', { total: 999, ready: 4, talking: 1, notReady: 4 });
    fixture.detectChanges();
    // total intentionally ignores the (wrong) summary.total of 999 — the
    // displayed center number must always match what the segments show.
    expect(component.total()).toBe(9);
  });

  it('produces one segment per state, each carrying its own value', () => {
    fixture.componentRef.setInput('summary', { total: 8, ready: 4, talking: 1, notReady: 3 });
    fixture.detectChanges();
    const segments = component.segments();
    expect(segments.map((s) => s.key)).toEqual(['ready', 'talking', 'notReady']);
    expect(segments.map((s) => s.value)).toEqual([4, 1, 3]);
  });

  it('segment arc lengths sum to the full circumference (no gap or overlap in the ring)', () => {
    fixture.componentRef.setInput('summary', { total: 8, ready: 4, talking: 1, notReady: 3 });
    fixture.detectChanges();

    const circumference = 2 * Math.PI * 15.9;
    const totalArcLength = component
      .segments()
      .reduce((sum, seg) => sum + parseFloat(seg.dashArray.split(' ')[0]), 0);

    expect(totalArcLength).toBeCloseTo(circumference, 5);
  });

  it('returns no segments and a zero total when there is no data', () => {
    fixture.componentRef.setInput('summary', null);
    fixture.detectChanges();
    expect(component.total()).toBe(0);
    expect(component.segments()).toEqual([]);
  });

  it('returns no segments when every count is zero, avoiding a divide-by-zero NaN arc', () => {
    fixture.componentRef.setInput('summary', { total: 0, ready: 0, talking: 0, notReady: 0 });
    fixture.detectChanges();
    expect(component.segments()).toEqual([]);
  });
});
