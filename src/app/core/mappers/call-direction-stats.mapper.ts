import { CallDirectionStatsDto } from '../models/dto';
import { CallDirectionStats } from '../models/domain';

export function mapCallDirectionStats(
  dto: CallDirectionStatsDto,
  direction: 'inbound' | 'outbound',
): CallDirectionStats {
  return {
    direction,
    count: dto.count,
    topAgentCalls: dto.topAgentCalls,
    lowestAgentCalls: dto.lowestAgentCalls,
  };
}
