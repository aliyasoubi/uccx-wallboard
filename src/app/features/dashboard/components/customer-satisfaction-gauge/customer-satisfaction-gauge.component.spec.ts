import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerSatisfactionGaugeComponent } from './customer-satisfaction-gauge.component';
import { ServiceMetrics } from '../../../../core/models/domain';

const metrics: ServiceMetrics = { slaPercent: 94.6, csatScore: 4.6, fcrPercent: 79.8 };

describe('CustomerSatisfactionGaugeComponent', () => {
  let fixture: ComponentFixture<CustomerSatisfactionGaugeComponent>;
  let component: CustomerSatisfactionGaugeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSatisfactionGaugeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerSatisfactionGaugeComponent);
    component = fixture.componentInstance;
  });

  it('renders the CSAT score to one decimal place', () => {
    fixture.componentRef.setInput('metrics', metrics);
    fixture.detectChanges();
    expect(component.hasData()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('4.6');
  });

  // Regression guard: this gauge used to render `(csatScore ?? 0).toFixed(1)`
  // in normal accent styling, so a missing reading appeared as a real score of
  // "0.0" — indistinguishable from a genuine, catastrophic CSAT of zero. The
  // SLA gauge beside it has always shown an em dash for the same case.
  it('shows the no-data placeholder, never a fabricated 0.0, when the score is missing', () => {
    for (const bad of [null, undefined, NaN]) {
      fixture.componentRef.setInput(
        'metrics',
        bad === null ? null : { ...metrics, csatScore: bad as unknown as number },
      );
      fixture.detectChanges();
      expect(component.hasData()).toBeFalse();
      expect(component.displayValue()).toBe('—');
      expect(component.csatColor()).toBe('var(--color-text-muted)');
      expect(fixture.nativeElement.textContent).not.toContain('0.0');
      expect(fixture.nativeElement.textContent).not.toContain('NaN');
    }
  });

  it('treats a genuine 0.0 score as real data and colors it normally', () => {
    fixture.componentRef.setInput('metrics', { ...metrics, csatScore: 0 });
    fixture.detectChanges();
    expect(component.hasData()).toBeTrue();
    expect(component.displayValue()).toBe('0.0');
    expect(component.csatColor()).toBe('var(--color-status-accent)');
  });
});
