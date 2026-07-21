// PROVISIONAL: field names below are not yet confirmed against a real BFF
// contract (see README §10 / CsqDto note). Mocked in CsqStats.json until the
// real queue-timings endpoint shape is confirmed — check field names before
// going live.
export interface QueueTimingStatsDto {
  currentWaitDuration: number; // seconds — CWD, longest call waiting right now
  maxAbandonDuration: number; // seconds — MAD, longest wait before an abandon
  avgHandleDuration: number; // seconds — ACT, average total handled-call time
}
