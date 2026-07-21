import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FooterComponent] }).compileComponents();
    fixture = TestBed.createComponent(FooterComponent);
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
    expect(fixture.nativeElement.textContent).toContain('Last update');
  });

  it('omits the last-update line when no update has happened yet', () => {
    fixture.componentRef.setInput('connectionState', 'live');
    fixture.componentRef.setInput('lastUpdated', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Last update');
  });
});
