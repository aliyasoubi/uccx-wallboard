// Matches CustomerServiceMetrics.json exactly.
export interface CustomerServiceMetricsDto {
  sla: number; // percentage, 0-100
  csat: number; // 0-5 scale
  // PROVISIONAL — no real backend field existed for this yet, mocked here
  // for the new KPI Metrics module. Confirm the real field name/definition
  // (e.g. single-contact vs. same-day resolution) before going live.
  fcr: number; // First Call Resolution, percentage, 0-100
}
