import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricTileComponent } from './metric-tile.component';

describe('MetricTileComponent', () => {
  let fixture: ComponentFixture<MetricTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MetricTileComponent] }).compileComponents();
    fixture = TestBed.createComponent(MetricTileComponent);
  });

  it('renders the label and value', () => {
    fixture.componentRef.setInput('label', 'Incoming calls');
    fixture.componentRef.setInput('value', 102);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Incoming calls');
    expect(text).toContain('102');
  });

  it('renders no icon element when icon is not provided (default, backward compatible)', () => {
    fixture.componentRef.setInput('label', 'Handled');
    fixture.componentRef.setInput('value', 205);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('i.ti')).toBeNull();
  });

  it('renders the given Tabler icon class, placed after the value (not inline with the label)', () => {
    fixture.componentRef.setInput('label', 'Incoming calls');
    fixture.componentRef.setInput('value', 102);
    fixture.componentRef.setInput('icon', 'ti-phone-incoming');
    fixture.detectChanges();
    const iconEl: HTMLElement = fixture.nativeElement.querySelector('i.ti.ti-phone-incoming.tile-icon');
    expect(iconEl).not.toBeNull();

    const valueEl: HTMLElement = fixture.nativeElement.querySelector('.value');
    // DOM order: value comes before the icon, matching "icon under the number".
    const position = valueEl.compareDocumentPosition(iconEl);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('colors the icon with the given iconColorVar', () => {
    fixture.componentRef.setInput('label', 'Abandoned calls');
    fixture.componentRef.setInput('value', 17);
    fixture.componentRef.setInput('icon', 'ti-phone-x');
    fixture.componentRef.setInput('iconColorVar', 'var(--color-status-critical)');
    fixture.detectChanges();
    const iconEl: HTMLElement = fixture.nativeElement.querySelector('i.ti-phone-x');
    expect(iconEl.style.color).toBe('var(--color-status-critical)');
  });

  it('defaults the icon color to the accent token when none is specified', () => {
    fixture.componentRef.setInput('label', 'Incoming calls');
    fixture.componentRef.setInput('value', 102);
    fixture.componentRef.setInput('icon', 'ti-phone-incoming');
    fixture.detectChanges();
    const iconEl: HTMLElement = fixture.nativeElement.querySelector('i.ti-phone-incoming');
    expect(iconEl.style.color).toBe('var(--color-status-accent)');
  });

  // Regression guard: the critical glow previously ran `infinite`, which
  // reads as background noise on a tile that stays critical for a long
  // stretch. It must flash a bounded number of times and stop, not loop
  // forever — the finite iteration-count is the whole fix, so assert it
  // directly rather than only the class name.
  it('flashes the critical glow a finite number of times instead of looping forever', () => {
    fixture.componentRef.setInput('label', 'Abandoned calls');
    fixture.componentRef.setInput('value', 40);
    fixture.componentRef.setInput('severity', 'critical');
    fixture.detectChanges();
    const tile: HTMLElement = fixture.nativeElement.querySelector('.tile');
    const iterationCount = getComputedStyle(tile).animationIterationCount;
    expect(iterationCount).not.toBe('infinite');
    expect(Number(iterationCount)).toBeGreaterThan(0);
  });

  it('escalates the tile itself at warning/critical severity, not just the value color', () => {
    fixture.componentRef.setInput('label', 'AHT');
    fixture.componentRef.setInput('value', '5:12');
    fixture.componentRef.setInput('severity', 'critical');
    fixture.detectChanges();
    const tile: HTMLElement = fixture.nativeElement.querySelector('.tile');
    expect(tile.classList).toContain('tile--critical');

    fixture.componentRef.setInput('severity', 'warning');
    fixture.detectChanges();
    expect(tile.classList).toContain('tile--warning');
    expect(tile.classList).not.toContain('tile--critical');

    fixture.componentRef.setInput('severity', 'normal');
    fixture.detectChanges();
    expect(tile.classList).not.toContain('tile--warning');
    expect(tile.classList).not.toContain('tile--critical');
  });

  it('applies critical-severity coloring to the value', () => {
    fixture.componentRef.setInput('label', 'Abandoned calls');
    fixture.componentRef.setInput('value', 17);
    fixture.componentRef.setInput('severity', 'critical');
    fixture.detectChanges();
    const valueEl: HTMLElement = fixture.nativeElement.querySelector('.value');
    expect(valueEl.style.color).toBe('var(--color-status-critical)');
  });
});
