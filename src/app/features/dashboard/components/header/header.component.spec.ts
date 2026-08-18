import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
  });

  it('shows a default title when none is provided', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('DotOne Trip Wallboard');
  });

  it('shows a custom title when provided', () => {
    fixture.componentRef.setInput('title', 'Support Wallboard');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Support Wallboard');
  });

  it('advances the displayed clock every second', () => {
    // jasmine.clock() fakes both timers AND Date together (via mockDate),
    // unlike Angular's fakeAsync/tick() which only fakes timer scheduling —
    // asserting on real Date deltas under fakeAsync is flaky because the
    // interval callback still reads the real, unfaked wall clock.
    //
    // Deliberately NOT using the shared `fixture`/`component` from
    // beforeEach here: that fixture is constructed before this test body
    // runs, so HeaderComponent's constructor would already have captured
    // the real (unmocked) Date by the time jasmine.clock().mockDate() is
    // installed below. Creating a fresh component after mocking the clock
    // ensures its initial `signal(new Date())` read is the mocked time too.
    const baseTime = new Date('2026-07-21T08:00:00Z');
    jasmine.clock().install();
    jasmine.clock().mockDate(baseTime);
    let localFixture: ComponentFixture<HeaderComponent> | undefined;
    try {
      localFixture = TestBed.createComponent(HeaderComponent);
      localFixture.detectChanges();
      expect(localFixture.componentInstance.now().getTime()).toBe(baseTime.getTime());

      jasmine.clock().tick(1000);
      expect(localFixture.componentInstance.now().getTime()).toBe(baseTime.getTime() + 1000);

      jasmine.clock().tick(3000);
      expect(localFixture.componentInstance.now().getTime()).toBe(baseTime.getTime() + 4000);
    } finally {
      localFixture?.destroy();
      jasmine.clock().uninstall();
    }
  });

  it('clears the clock interval on destroy (no leaked timer)', () => {
    const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
    fixture.detectChanges();
    fixture.destroy();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
