import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { AgentStatus } from '../../../core/models/domain';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let component: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('shows the default label for each status when no reason is set', () => {
    fixture.componentRef.setInput('status', AgentStatus.Ready);
    fixture.detectChanges();
    expect(component.visual().label).toBe('Ready');

    fixture.componentRef.setInput('status', AgentStatus.Talking);
    fixture.detectChanges();
    expect(component.visual().label).toBe('Talking');

    fixture.componentRef.setInput('status', AgentStatus.NotReady);
    fixture.detectChanges();
    expect(component.visual().label).toBe('Not ready');
  });

  it('shows the reason text in place of the generic label when Not Ready', () => {
    fixture.componentRef.setInput('status', AgentStatus.NotReady);
    fixture.componentRef.setInput('reason', 'Break');
    fixture.detectChanges();
    expect(component.visual().label).toBe('Break');
    expect(fixture.nativeElement.textContent).toContain('Break');
  });

  it('keeps the Not Ready color/background even when the reason overrides the label', () => {
    fixture.componentRef.setInput('status', AgentStatus.NotReady);
    fixture.componentRef.setInput('reason', 'Break');
    fixture.detectChanges();
    expect(component.visual().colorVar).toBe('var(--color-text-secondary)');
    expect(component.visual().bgVar).toBe('var(--color-surface-2)');
  });

  it('ignores a reason for Ready/Talking — only Not Ready ever shows a sub-reason', () => {
    fixture.componentRef.setInput('status', AgentStatus.Ready);
    fixture.componentRef.setInput('reason', 'Break');
    fixture.detectChanges();
    expect(component.visual().label).toBe('Ready');
  });

  it('falls back to the generic "Not ready" label when there is no reason', () => {
    fixture.componentRef.setInput('status', AgentStatus.NotReady);
    fixture.componentRef.setInput('reason', null);
    fixture.detectChanges();
    expect(component.visual().label).toBe('Not ready');
  });

  it('renders a status-specific Tabler icon alongside the label, never color alone', () => {
    fixture.componentRef.setInput('status', AgentStatus.Ready);
    fixture.detectChanges();
    let icon: HTMLElement = fixture.nativeElement.querySelector('.badge-icon');
    expect(icon.classList).toContain('ti-circle-check');

    fixture.componentRef.setInput('status', AgentStatus.Talking);
    fixture.detectChanges();
    icon = fixture.nativeElement.querySelector('.badge-icon');
    expect(icon.classList).toContain('ti-phone');

    fixture.componentRef.setInput('status', AgentStatus.NotReady);
    fixture.detectChanges();
    icon = fixture.nativeElement.querySelector('.badge-icon');
    expect(icon.classList).toContain('ti-player-pause');
  });
});
