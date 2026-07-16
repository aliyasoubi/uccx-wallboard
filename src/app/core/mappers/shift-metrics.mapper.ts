import { ShiftMetricsDto } from '../models/dto';
import { ShiftMetrics } from '../models/domain';

export function mapShiftMetrics(dto: ShiftMetricsDto): ShiftMetrics {
  return {
    avgHandleSeconds: dto.avgHandleTimeSeconds,
    totalTalkSeconds: dto.totalTalkTimeSeconds,
  };
}
