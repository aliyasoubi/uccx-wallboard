import { Pipe, PipeTransform } from '@angular/core';

// Formats seconds as m:ss, or h:mm:ss once past an hour.
@Pipe({ name: 'formatDuration', standalone: true })
export class FormatDurationPipe implements PipeTransform {
  transform(totalSeconds: number | null | undefined): string {
    if (totalSeconds == null || Number.isNaN(totalSeconds)) return '--:--';
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
}
