import { mapServiceMetrics } from './service-metrics.mapper';

describe('service-metrics.mapper', () => {
  it('maps sla/csat/fcr to their domain fields', () => {
    const metrics = mapServiceMetrics({ sla: 94.6, csat: 4.6, fcr: 79.8 });
    expect(metrics).toEqual({ slaPercent: 94.6, csatScore: 4.6, fcrPercent: 79.8 });
  });
});
