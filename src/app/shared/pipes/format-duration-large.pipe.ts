import { Pipe, PipeTransform } from "@angular/core";


function formatDuration(totalSeconds: number) {
    const totalMinutes = Math.floor(totalSeconds / 60);

    //const days = Math.floor(totalMinutes / 1440);
    //const hours = Math.floor((totalMinutes % 1440) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const parts = [];

    //if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    //if (minutes || parts.length === 0) parts.push(`${minutes}m`);
    if (parts.length === 0) parts.push(`${minutes}m`);

    return parts.join(" ");
}

@Pipe({ name: 'formatDurationLarge', standalone: true })
export class FormatDurationLargePipe implements PipeTransform {
    transform(totalSeconds: number | null | undefined): string {
        if (totalSeconds == null || Number.isNaN(totalSeconds)) {
            return "-"
        }
        return formatDuration(totalSeconds);
    }
}
