import { getInverseSeverity, getRatioSeverity, getSeverity, STATUS_THRESHOLDS } from './status-thresholds.policy';

describe('status-thresholds.policy', () => {
  describe('getSeverity (higher is worse)', () => {
    const thresholds = { warning: 30, critical: 60 };

    it('returns normal below the warning threshold', () => {
      expect(getSeverity(29, thresholds)).toBe('normal');
    });

    it('returns warning at the warning threshold boundary', () => {
      expect(getSeverity(30, thresholds)).toBe('warning');
    });

    it('returns warning between the two thresholds', () => {
      expect(getSeverity(45, thresholds)).toBe('warning');
    });

    it('returns critical at the critical threshold boundary', () => {
      expect(getSeverity(60, thresholds)).toBe('critical');
    });

    it('returns critical above the critical threshold', () => {
      expect(getSeverity(999, thresholds)).toBe('critical');
    });
  });

  describe('getInverseSeverity (lower is worse, e.g. SLA%)', () => {
    const thresholds = STATUS_THRESHOLDS.slaPercent; // { warning: 80, critical: 50 }

    it('returns normal above the warning floor', () => {
      expect(getInverseSeverity(95, thresholds)).toBe('normal');
    });

    it('returns warning at the warning floor boundary', () => {
      expect(getInverseSeverity(80, thresholds)).toBe('warning');
    });

    it('returns warning between the two floors', () => {
      expect(getInverseSeverity(65, thresholds)).toBe('warning');
    });

    it('returns critical at the critical floor boundary', () => {
      expect(getInverseSeverity(50, thresholds)).toBe('critical');
    });

    it('returns critical below the critical floor', () => {
      expect(getInverseSeverity(0, thresholds)).toBe('critical');
    });
  });

  describe('getRatioSeverity', () => {
    const thresholds = STATUS_THRESHOLDS.abandonedRatio; // { warning: 0.05, critical: 0.10 }

    it('computes severity from numerator/denominator', () => {
      expect(getRatioSeverity(17, 500, thresholds)).toBe('normal'); // 3.4%
      expect(getRatioSeverity(30, 500, thresholds)).toBe('warning'); // 6%
      expect(getRatioSeverity(60, 500, thresholds)).toBe('critical'); // 12%
    });

    it('returns normal instead of dividing by zero when the denominator is zero', () => {
      expect(getRatioSeverity(0, 0, thresholds)).toBe('normal');
      expect(getRatioSeverity(5, 0, thresholds)).toBe('normal');
    });

    it('returns normal for a negative/invalid denominator rather than throwing', () => {
      expect(getRatioSeverity(5, -1, thresholds)).toBe('normal');
    });
  });
});
