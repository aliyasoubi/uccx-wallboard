// One canonical status enum used everywhere in the UI —
// components never branch on raw DTO strings like "READY"/"NOT_READY" directly.
export enum AgentStatus {
  Ready = 'ready',
  Talking = 'talking',
  NotReady = 'not-ready',
}

export type Severity = 'normal' | 'warning' | 'critical';
