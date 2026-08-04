// Matches CallStats.json exactly.
export interface InboundCallStatsDto {
  totalTalkDuration: number;
  avgTalkDuration: number;
  maxTalkDuration: number;

  avgWaitDuration: number;
  maxWaitDuration: number;

  avgHandleDuration: number;

  totalCalls: number;
  handledCalls: number;
  abandonedCalls: number;
  waitingCalls: number;
}


export interface OutboundCallStatsDto {
  totalTalkDuration: number;
  avgTalkDuration: number;
  maxTalkDuration: number;
  
  totalCalls: number;
}