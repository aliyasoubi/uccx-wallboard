// Matches CallStats.json exactly.
export interface CallStatsDto {
  avgTalkDuration: number; // seconds
  avgWaitDuration: number; // seconds
  abandonedCalls: number;
  handledCalls: number;
  totalCalls: number;
  callsWaiting: number;
}
