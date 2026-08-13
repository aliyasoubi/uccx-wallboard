import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppConfigService } from '../config/app-config.service';
import {
  mapAgentOfMonth,
  mapAgents,
  mapCallDirectionStats,
  mapCallSummary,
  mapOutboundCallDirectionStats,
  mapQueues,
  mapServiceMetrics,
} from '../mappers';
import {
  AgentOfMonthDto,
  AgentDto,
  AgentStateCountsDto,
  InboundCallStatsDto,
  CsqDto,
  CustomerServiceMetricsDto,
  OutboundCallStatsDto,
} from '../models/dto';
import { DashboardSnapshot } from '../models/domain';

// Stands in for the BFF described in the README (§3) until a real backend
// endpoint exists. Base URL and mock-vs-real toggle both come from
// src/environments/environment*.ts — see CONFIGURATION.md for how to point
// this at a real backend.
@Injectable({ providedIn: 'root' })
export class BffClientService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  // useMockFixtures stays a build-time environment.ts concern (it decides
  // whether this deployment target talks to fixtures at all). apiBaseUrl
  // itself comes from the runtime config loaded by AppConfigService
  // (assets/config.json) so the real API/DB address can be changed on a
  // deployed server without a rebuild — see CONFIGURATION.md.
  private get base(): string {
    return environment.useMockFixtures ? 'assets/fixtures' : this.appConfig.config().apiBaseUrl;
  }

  fetchSnapshot(): Observable<DashboardSnapshot> {
    return forkJoin({
      agents: this.http.get<AgentDto[]>(this.endpoint('AgentStates.json', '/agents')),
      inboundCallStats: this.http.get<InboundCallStatsDto>(this.endpoint('InboundCallStats.json', '/inbound-call-stats')),
      outboundCallStats: this.http.get<OutboundCallStatsDto>(this.endpoint('OutboundCallStats.json', '/outbound-call-stats')),
      serviceMetrics: this.http.get<CustomerServiceMetricsDto>(
        this.endpoint('CustomerServiceMetrics.json', '/service-metrics'),
      ),
      agentStateCounts: this.http.get<AgentStateCountsDto>(
        this.endpoint('AgentStateStats.json', '/agent-state-counts'),
      ),
      queues: this.http.get<CsqDto[]>(this.endpoint('CsqStats.json', '/csqs')),
      agentOfMonth: this.http.get<AgentOfMonthDto>(this.endpoint('AgentOfMonth.json', '/agent-of-month')),
    }).pipe(
      map(
        ({
          agents,
          inboundCallStats,
          outboundCallStats,
          serviceMetrics,
          agentStateCounts,
          queues,
          agentOfMonth,
        }) => {
          const mappedAgents = mapAgents(agents);
          return {
            callSummary: mapCallSummary(inboundCallStats),
            serviceMetrics: mapServiceMetrics(serviceMetrics),
            agentStateSummary: agentStateCounts,
            agents: mappedAgents,
            queues: mapQueues(queues),
            agentOfMonth: mapAgentOfMonth(agentOfMonth, mappedAgents),
            inboundStats: mapCallDirectionStats(agents, 'inbound'),
            outboundStats: mapOutboundCallDirectionStats(outboundCallStats),
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
