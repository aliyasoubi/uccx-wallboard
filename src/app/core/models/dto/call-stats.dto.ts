// Inbound call statistics. Matches InboundCallStats.json (mock mode) and the
// BFF's /inbound-call-stats response. Also reused as the shape of
// CsqDto.callStats, which is where a queue's MWD/ACT values now come from —
// see queue.mapper.ts, and note that those field meanings remain provisional
// (CLAUDE.md, "Known-provisional fields").
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

// Outbound call statistics. Matches OutboundCallStats.json (mock mode) and
// the BFF's /outbound-call-stats response. Deliberately narrower than the
// inbound shape: outbound calls have no queue, so there are no wait/abandon
// or handled counts to report.
export interface OutboundCallStatsDto {
  totalTalkDuration: number;
  avgTalkDuration: number;
  maxTalkDuration: number;

  totalCalls: number;
}
