import { Pipe, PipeTransform } from '@angular/core';

/** Rendered in place of a duration that is missing or not a number. */
export const DURATION_PLACEHOLDER = '--:--';

// Formats seconds as m:ss, or h:mm:ss once past an hour.
//
// Exported as a plain function, not only as a pipe, because durations are
// also formatted outside templates (QueueListComponent builds its stat rows
// in TypeScript). That component previously carried a private copy of this
// arithmetic that omitted the null/NaN guard below and rendered "NaN:NaN"
// whenever a backend field was absent — keeping one implementation means the
// guard can't be dropped in a copy again.
export function formatDurationSeconds(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return DURATION_PLACEHOLDER;
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

@Pipe({ name: 'formatDuration', standalone: true })
export class FormatDurationPipe implements PipeTransform {
  transform(totalSeconds: number | null | undefined): string {
    return formatDurationSeconds(totalSeconds);
  }
}
