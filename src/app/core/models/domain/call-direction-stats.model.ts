export interface CallDirectionStats {
  direction: 'inbound' | 'outbound';
  // Organization-wide totals, taken from the direction's own endpoint rather
  // than summed from the agent roster — the endpoint counts calls handled by
  // agents who have since logged out, which a roster sum silently misses.
  count: number;
  totalTalkSeconds: number;
  // Per-agent high/low, necessarily still derived from the roster.
  topAgentCalls: number;
  lowestAgentCalls: number;
}
