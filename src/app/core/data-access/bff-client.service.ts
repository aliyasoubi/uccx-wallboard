import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  mapAgentOfMonth,
  mapAgents,
  mapCallDirectionStats,
  mapCallSummary,
  mapQueues,
  mapServiceMetrics,
  mapShiftMetrics,
  mapSkills,
} from '../mappers';
import {
  AgentOfMonthDto,
  AgentStateDto,
  AgentStateStatsDto,
  CallDirectionStatsDto,
  CallStatsDto,
  CsqStatsDto,
  CustomerServiceMetricsDto,
  ShiftMetricsDto,
  SkillStatDto,
} from '../models/dto';
import { DashboardSnapshot } from '../models/domain';

// Stands in for the BFF described in the README (§3) until a real backend
// endpoint exists. Base URL and mock-vs-real toggle both come from
// src/environments/environment*.ts — see CONFIGURATION.md for how to point
// this at a real backend.
@Injectable({ providedIn: 'root' })
export class BffClientService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.useMockFixtures ? 'assets/fixtures' : environment.apiBaseUrl;

  fetchSnapshot(): Observable<DashboardSnapshot> {
    return forkJoin({
      agents: this.http.get<AgentStateDto[]>(this.endpoint('AgentStates.json', '/agents')),
      callStats: this.http.get<CallStatsDto>(this.endpoint('CallStats.json', '/call-stats')),
      serviceMetrics: this.http.get<CustomerServiceMetricsDto>(
        this.endpoint('CustomerServiceMetrics.json', '/service-metrics'),
      ),
      agentStateStats: this.http.get<AgentStateStatsDto>(
        this.endpoint('AgentStateStats.json', '/agent-state-stats'),
      ),
      queues: this.http.get<CsqStatsDto[]>(this.endpoint('CsqStats.json', '/queues')),
      agentOfMonth: this.http.get<AgentOfMonthDto>(this.endpoint('AgentOfMonth.json', '/agent-of-month')),
      topSkills: this.http.get<SkillStatDto[]>(this.endpoint('TopSkills.json', '/top-skills')),
      inboundStats: this.http.get<CallDirectionStatsDto>(
        this.endpoint('InboundStats.json', '/call-direction/inbound'),
      ),
      outboundStats: this.http.get<CallDirectionStatsDto>(
        this.endpoint('OutboundStats.json', '/call-direction/outbound'),
      ),
      shiftMetrics: this.http.get<ShiftMetricsDto>(this.endpoint('ShiftMetrics.json', '/shift-metrics')),
    }).pipe(
      map(
        ({
          agents,
          callStats,
          serviceMetrics,
          agentStateStats,
          queues,
          agentOfMonth,
          topSkills,
          inboundStats,
          outboundStats,
          shiftMetrics,
        }) => {
          const mappedAgents = mapAgents(agents);
          return {
            callSummary: mapCallSummary(callStats),
            serviceMetrics: mapServiceMetrics(serviceMetrics),
            agentStateSummary: agentStateStats,
            agents: mappedAgents,
            queues: mapQueues(queues),
            agentOfMonth: mapAgentOfMonth(agentOfMonth, mappedAgents),
            topSkills: mapSkills(topSkills),
            inboundStats: mapCallDirectionStats(inboundStats, 'inbound'),
            outboundStats: mapCallDirectionStats(outboundStats, 'outbound'),
            shiftMetrics: mapShiftMetrics(shiftMetrics),
            fetchedAt: new Date().toISOString(),
          } satisfies DashboardSnapshot;
        },
      ),
    );
  }

  // In mock mode, fixtures are flat files named after the resource. In real
  // mode, real BFF routes are used instead — adjust the route strings here
  // if the actual BFF's paths differ from these placeholders.
  private endpoint(fixtureFile: string, realPath: string): string {
    return environment.useMockFixtures ? `${this.base}/${fixtureFile}` : `${this.base}${realPath}`;
  }
}
