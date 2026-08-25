import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
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

  // Each request is wrapped in its own catchError below, so forkJoin itself
  // never rejects on one bad endpoint — every member always resolves, with
  // `null` standing in for "this one failed this tick". Previously a single
  // failing resource (agent photos, queue data, anything) rejected the
  // WHOLE forkJoin and no widget on the board updated that tick, even the
  // six that fetched fine. See dashboard-snapshot.model.ts for how that
  // null propagates into per-field graceful degradation instead.
  fetchSnapshot(): Observable<DashboardSnapshot> {
    return forkJoin({
      agents: this.getOrNull<AgentDto[]>('agents', 'AgentStates.json', '/agents'),
      inboundCallStats: this.getOrNull<InboundCallStatsDto>(
        'inboundCallStats',
        'InboundCallStats.json',
        '/inbound-call-stats',
      ),
      outboundCallStats: this.getOrNull<OutboundCallStatsDto>(
        'outboundCallStats',
        'OutboundCallStats.json',
        '/outbound-call-stats',
      ),
      serviceMetrics: this.getOrNull<CustomerServiceMetricsDto>(
        'serviceMetrics',
        'CustomerServiceMetrics.json',
        '/service-metrics',
      ),
      agentStateCounts: this.getOrNull<AgentStateCountsDto>(
        'agentStateCounts',
        'AgentStateStats.json',
        '/agent-state-counts',
      ),
      queues: this.getOrNull<CsqDto[]>('queues', 'CsqStats.json', '/csqs'),
      agentOfMonth: this.getOrNull<AgentOfMonthDto>(
        'agentOfMonth',
        'AgentOfMonth.json',
        '/agent-of-month',
      ),
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
          // Raw agents is the join key several other fields depend on
          // (agent-of-month name resolution, per-agent call-count spread).
          // Mapped once here so a null raw fetch degrades every dependent
          // field consistently, while fields that don't need the roster
          // (callSummary, serviceMetrics, queues) are unaffected by an
          // agents-endpoint failure.
          const mappedAgents = agents ? mapAgents(agents) : null;

          // agentOfMonth requires BOTH its own endpoint AND agents to have
          // succeeded, not agentOfMonth alone with an empty-roster fallback:
          // resolving a winner with a real photo but a blank name (because
          // the roster fetch failed) is a worse result on screen than simply
          // holding whatever agent-of-month value was already showing.
          const agentOfMonthMapped =
            agentOfMonth && mappedAgents ? mapAgentOfMonth(agentOfMonth, mappedAgents) : null;

          // outboundStats' per-agent high/low CAN degrade to the
          // empty-roster default (0/0) without making the field misleading —
          // unlike agentOfMonth's name, "no per-agent spread data" isn't
          // something a viewer could mistake for a real reading — so this one
          // only requires its own endpoint, not agents too.
          const outboundStatsMapped = outboundCallStats
            ? mapOutboundCallDirectionStats(outboundCallStats, agents ?? [])
            : null;

          return {
            callSummary: inboundCallStats ? mapCallSummary(inboundCallStats) : null,
            serviceMetrics: serviceMetrics ? mapServiceMetrics(serviceMetrics) : null,
            agentStateSummary: agentStateCounts,
            agents: mappedAgents,
            queues: queues ? mapQueues(queues) : null,
            agentOfMonth: agentOfMonthMapped,
            inboundStats: agents ? mapCallDirectionStats(agents, 'inbound') : null,
            outboundStats: outboundStatsMapped,
            fetchedAt: new Date().toISOString(),
          } satisfies DashboardSnapshot;
        },
      ),
      switchMap((snapshot) => {
        // The one case that must still read as a failed poll, not a
        // successful-but-empty one: every endpoint failed. PollingDataSource's
        // stale/error escalation (and the "Live" footer text) is driven by
        // whether fetchSnapshot() errors, and per-request catchError below
        // means forkJoin itself no longer naturally errors on its own —
        // this is what still lets a total BFF outage surface as an error
        // instead of silently "succeeding" with an all-null snapshot.
        const allFailed = Object.entries(snapshot).every(
          ([key, value]) => key === 'fetchedAt' || value === null,
        );
        return allFailed
          ? throwError(() => new Error('All BFF resources failed to load this poll'))
          : of(snapshot);
      }),
    );
  }

  private getOrNull<T>(
    fieldName: string,
    fixtureFile: string,
    realPath: string,
  ): Observable<T | null> {
    return this.http.get<T>(this.endpoint(fixtureFile, realPath)).pipe(
      catchError((err) => {
        console.error(`[BffClientService] Failed to load "${fieldName}" this poll`, err);
        return of(null);
      }),
    );
  }

  // In mock mode, fixtures are flat files named after the resource. In real
  // mode, real BFF routes are used instead — adjust the route strings here
  // if the actual BFF's paths differ from these placeholders.
  private endpoint(fixtureFile: string, realPath: string): string {
    return environment.useMockFixtures ? `${this.base}/${fixtureFile}` : `${this.base}${realPath}`;
  }
}
