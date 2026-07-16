import { CustomerServiceMetricsDto } from '../models/dto';
import { ServiceMetrics } from '../models/domain';

export function mapServiceMetrics(dto: CustomerServiceMetricsDto): ServiceMetrics {
  return {
    slaPercent: dto.sla,
    csatScore: dto.csat,
  };
}
