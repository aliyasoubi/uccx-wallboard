// Matches CallStats.json exactly.
export interface CallStatsDto {
  avgTalkDuration: number; // seconds
  avgWaitDuration: number; // seconds
  longestTalkDuration: number;
  LongestWaitDuration: number;
  abandonedCalls: number;
  handledCalls: number;
  totalCalls: number;
  waitingCalls: number;
}
