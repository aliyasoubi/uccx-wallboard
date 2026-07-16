export interface CallSummary {
  totalCalls: number;
  handledCalls: number;
  abandonedCalls: number;
  avgWaitSeconds: number;
  avgTalkSeconds: number;
  callsWaiting: number;
}
