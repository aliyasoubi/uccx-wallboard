export interface ServiceMetrics {
  slaPercent: number;
  csatScore: number; // 0-5
  fcrPercent: number; // First Call Resolution — see CustomerServiceMetricsDto for mock caveat
}
