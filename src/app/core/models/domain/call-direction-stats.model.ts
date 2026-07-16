export interface CallDirectionStats {
  direction: 'inbound' | 'outbound';
  count: number;
  topAgentCalls: number;
  lowestAgentCalls: number;
}
