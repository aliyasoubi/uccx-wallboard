import {
  DURATION_PLACEHOLDER,
  FormatDurationPipe,
  formatDurationSeconds,
} from './format-duration.pipe';

describe('formatDurationSeconds', () => {
  it('formats under an hour as m:ss', () => {
    expect(formatDurationSeconds(0)).toBe('0:00');
    expect(formatDurationSeconds(61)).toBe('1:01');
    expect(formatDurationSeconds(133)).toBe('2:13');
    expect(formatDurationSeconds(3599)).toBe('59:59');
  });

  it('formats an hour or more as h:mm:ss', () => {
    expect(formatDurationSeconds(3600)).toBe('1:00:00');
    expect(formatDurationSeconds(3661)).toBe('1:01:01');
  });

  // The guard this whole function exists to centralize: QueueListComponent
  // previously duplicated the arithmetic without it and rendered "NaN:NaN"
  // on the wallboard whenever a backend duration field was absent.
  it('returns the placeholder for null, undefined, and NaN rather than NaN:NaN', () => {
    expect(formatDurationSeconds(null)).toBe(DURATION_PLACEHOLDER);
    expect(formatDurationSeconds(undefined)).toBe(DURATION_PLACEHOLDER);
    expect(formatDurationSeconds(NaN)).toBe(DURATION_PLACEHOLDER);
  });

  it('clamps negative durations to zero instead of rendering a negative clock', () => {
    expect(formatDurationSeconds(-5)).toBe('0:00');
  });

  it('truncates fractional seconds', () => {
    expect(formatDurationSeconds(61.9)).toBe('1:01');
  });
});

describe('FormatDurationPipe', () => {
  it('delegates to formatDurationSeconds so template and TypeScript call sites agree', () => {
    const pipe = new FormatDurationPipe();
    for (const input of [null, undefined, NaN, 0, 61, 3661, -5]) {
      expect(pipe.transform(input)).toBe(formatDurationSeconds(input));
    }
  });
});
