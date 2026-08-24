import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AgentOfMonthComponent } from './agent-of-month.component';

describe('AgentOfMonthComponent', () => {
  let fixture: ComponentFixture<AgentOfMonthComponent>;
  let component: AgentOfMonthComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AgentOfMonthComponent] }).compileComponents();
    fixture = TestBed.createComponent(AgentOfMonthComponent);
    component = fixture.componentInstance;
  });

  it('shows the em-dash fallback name and "?" initials when no agent is set', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('—');
    expect(
      fixture.debugElement.query(By.css('.photo--fallback')).nativeElement.textContent.trim(),
    ).toBe('?');
  });

  it('renders the photo when a URL is supplied', () => {
    fixture.componentRef.setInput('agent', {
      agentId: 'A1',
      name: 'John Smith',
      photoUrl: 'https://example.com/a.jpg',
    });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('img.photo'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('.photo--fallback'))).toBeNull();
  });

  it('renders initials instead of a broken <img> when photoUrl is empty', () => {
    fixture.componentRef.setInput('agent', { agentId: 'A1', name: 'John Smith', photoUrl: '' });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('img.photo'))).toBeNull();
    expect(
      fixture.debugElement.query(By.css('.photo--fallback')).nativeElement.textContent.trim(),
    ).toBe('JS');
  });

  // Regression guard: a non-empty photoUrl only says a URL was supplied, not
  // that it actually loads. The fallback used to trigger only on an EMPTY
  // URL, so a broken (non-empty) one rendered a broken-image icon instead of
  // the initials.
  it('falls back to initials when a supplied photo URL fails to load', () => {
    fixture.componentRef.setInput('agent', {
      agentId: 'A1',
      name: 'John Smith',
      photoUrl: 'https://example.com/broken.jpg',
    });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('img.photo'))).not.toBeNull();

    component.onPhotoError();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('img.photo'))).toBeNull();
    expect(
      fixture.debugElement.query(By.css('.photo--fallback')).nativeElement.textContent.trim(),
    ).toBe('JS');
  });

  // A poll can hand this component a new agent (a new photoUrl) at any
  // time — a previous agent's failure must not suppress a brand new,
  // perfectly good photo for whoever is shown next.
  it('does not carry a previous photo failure over to a newly assigned agent', () => {
    fixture.componentRef.setInput('agent', {
      agentId: 'A1',
      name: 'John Smith',
      photoUrl: 'https://example.com/broken.jpg',
    });
    fixture.detectChanges();
    component.onPhotoError();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('img.photo'))).toBeNull();

    fixture.componentRef.setInput('agent', {
      agentId: 'A2',
      name: 'Sarah Johnson',
      photoUrl: 'https://example.com/good.jpg',
    });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('img.photo'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('.photo--fallback'))).toBeNull();
  });
});
