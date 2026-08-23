import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AgentOfMonthComponent } from './agent-of-month.component';
import { Agent, AgentOfMonth, AgentStatus } from '../../../../core/models/domain';

const winners: AgentOfMonth[] = [
  { agentId: 'A1002', name: 'حسین نصیری', photoUrl: null },
  { agentId: 'A1003', name: 'دیبا حبیب‌الهی', photoUrl: null },
  { agentId: 'A1004', name: 'امیر محمد فلاح', photoUrl: null },
];

function buildAgent(id: string, inbound: number, outbound: number): Agent {
  return {
    id,
    name: `Agent ${id}`,
    status: AgentStatus.Ready,
    statusDurationSeconds: 0,
    reason: null,
    inboundCalls: inbound,
    outboundCalls: outbound,
  };
}

const roster: Agent[] = [
  buildAgent('A1002', 120, 76), // 196
  buildAgent('A1003', 100, 79), // 179
  buildAgent('A1004', 100, 43), // 143
];

describe('AgentOfMonthComponent', () => {
  let fixture: ComponentFixture<AgentOfMonthComponent>;
  let component: AgentOfMonthComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AgentOfMonthComponent] }).compileComponents();
    fixture = TestBed.createComponent(AgentOfMonthComponent);
    component = fixture.componentInstance;
  });

  it('renders every winner, not just the first', () => {
    fixture.componentRef.setInput('agents', winners);
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.place')).length).toBe(3);
  });

  // Podium order is 2nd | 1st | 3rd so the winner sits in the middle. The
  // rank travels with the entry, so this is display order only — it must not
  // change who actually placed where.
  it('lays the podium out as 2nd, 1st, 3rd while keeping ranks correct', () => {
    fixture.componentRef.setInput('agents', winners);
    fixture.detectChanges();
    expect(component.podium().map((p) => p.rank)).toEqual([2, 1, 3]);
    expect(component.podium().map((p) => p.name)).toEqual([
      'دیبا حبیب‌الهی',
      'حسین نصیری',
      'امیر محمد فلاح',
    ]);
    const badges = fixture.debugElement
      .queryAll(By.css('.rank-badge'))
      .map((el) => el.nativeElement.textContent.trim());
    expect(badges).toEqual(['2', '1', '3']);
  });

  it('marks exactly one first-place entry', () => {
    fixture.componentRef.setInput('agents', winners);
    fixture.detectChanges();
    const first = fixture.debugElement.queryAll(By.css('.place--first'));
    expect(first.length).toBe(1);
    expect(first[0].query(By.css('.name')).nativeElement.textContent.trim()).toBe('حسین نصیری');
  });

  it('resolves each winner call count from the roster as inbound + outbound', () => {
    fixture.componentRef.setInput('agents', winners);
    fixture.componentRef.setInput('roster', roster);
    fixture.detectChanges();
    const byName = Object.fromEntries(component.podium().map((p) => [p.name, p.calls]));
    expect(byName['حسین نصیری']).toBe(196);
    expect(byName['دیبا حبیب‌الهی']).toBe(179);
    expect(byName['امیر محمد فلاح']).toBe(143);
  });

  // A winner who has logged out is gone from the roster. Showing "0 Calls"
  // there would be a fabricated number, so the count is omitted instead.
  it('omits the call count for a winner missing from the roster, rather than showing 0', () => {
    fixture.componentRef.setInput('agents', winners);
    fixture.componentRef.setInput('roster', [buildAgent('A1002', 120, 76)]);
    fixture.detectChanges();
    expect(component.podium().find((p) => p.agentId === 'A1003')!.calls).toBeNull();
    expect(fixture.debugElement.queryAll(By.css('.calls')).length).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain('NaN');
  });

  // Regression guard: the initials were computed but never rendered, so every
  // winner showed as a bare name with an empty gap where the avatar belonged.
  it('renders an initials avatar for each winner when no photo is supplied', () => {
    fixture.componentRef.setInput('agents', winners);
    fixture.detectChanges();
    const avatars = fixture.debugElement.queryAll(By.css('.avatar--fallback'));
    expect(avatars.length).toBe(3);
    expect(avatars.every((el) => el.nativeElement.textContent.trim().length > 0)).toBeTrue();
  });

  it('prefers a real photo over the initials fallback', () => {
    fixture.componentRef.setInput('agents', [
      { agentId: 'A1', name: 'John Smith', photoUrl: 'https://example.com/a.jpg' },
    ]);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('img.avatar'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('.avatar--fallback'))).toBeNull();
  });

  it('falls back to "?" rather than an empty avatar for a nameless winner', () => {
    fixture.componentRef.setInput('agents', [{ agentId: 'A1', name: null, photoUrl: null }]);
    fixture.detectChanges();
    expect(component.podium()[0].initials).toBe('?');
  });

  // Fewer than three winners has no podium arrangement to make — the entries
  // must still render in plain finishing order rather than being dropped.
  it('renders a short list in plain order instead of reshuffling it', () => {
    fixture.componentRef.setInput('agents', winners.slice(0, 2));
    fixture.detectChanges();
    expect(component.podium().map((p) => p.rank)).toEqual([1, 2]);
    expect(fixture.debugElement.queryAll(By.css('.place')).length).toBe(2);
  });

  it('shows the empty state for a null or empty winners list', () => {
    for (const value of [null, []]) {
      fixture.componentRef.setInput('agents', value);
      fixture.detectChanges();
      expect(component.podium()).toEqual([]);
      expect(fixture.nativeElement.textContent).toContain('No data');
    }
  });
});
