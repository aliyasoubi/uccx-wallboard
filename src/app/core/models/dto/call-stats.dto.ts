// Matches CallStats.json exactly.
export interface CallStatsDto {
  maxTalkDuration: number;
  avgTalkDuration: number;

  maxWaitDuration: number;
  avgWaitDuration: number;

  abandonedCalls: number;
  handledCalls: number;
  totalCalls: number;
  waitingCalls: number;
}
