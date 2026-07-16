// Matches CustomerServiceMetrics.json exactly.
export interface CustomerServiceMetricsDto {
  sla: number; // percentage, 0-100
  csat: number; // 0-5 scale
}
