import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FooterComponent] }).compileComponents();
    fixture = TestBed.createComponent(FooterComponent);
  });

  it('shows "Connecting" status text by default, before any data has arrived', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Connecting');
  });

  it('shows "Live" status text when connectionState is live', () => {
    fixture.componentRef.setInput('connectionState', 'live');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Live');
  });

  it('shows "Reconnecting" status text when connectionState is stale', () => {
    fixture.componentRef.setInput('connectionState', 'stale');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reconnecting');
  });

  it('shows "Connection lost" status text when connectionState is error', () => {
    fixture.componentRef.setInput('connectionState', 'error');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Connection lost');
  });

  it('shows the last update time when provided', () => {
    fixture.componentRef.setInput('connectionState', 'live');
    fixture.componentRef.setInput('lastUpdated', new Date('2026-07-21T08:00:00'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Updated');
  });

  it('omits the last-update line when no update has happened yet', () => {
    fixture.componentRef.setInput('connectionState', 'live');
    fixture.componentRef.setInput('lastUpdated', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Updated');
  });

  it('shows a relative data age ("Xs ago") rather than only a fixed timestamp', () => {
    const fortySecondsAgo = new Date(Date.now() - 40_000);
    fixture.componentRef.setInput('connectionState', 'live');
    fixture.componentRef.setInput('lastUpdated', fortySecondsAgo);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toMatch(/\d+s ago/);
  });

  it('applies a visible stale/error background, not just a status dot, so an outage reads at a glance', () => {
    fixture.componentRef.setInput('connectionState', 'error');
    fixture.detectChanges();
    const footer: HTMLElement = fixture.nativeElement.querySelector('.footer');
    expect(footer.classList).toContain('footer--error');
  });
});
