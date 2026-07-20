import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
// Multi-language disabled for this release — see app.config.ts for how to
// re-enable. TranslocoModule import and setLang() removed from here too.
import { DashboardStoreService } from '../../core/state/dashboard-store.service';
import { AgentOfMonthCardComponent, AgentStateDonutComponent } from '../../shared/components';
import { CallsSummaryPanelComponent } from './components/calls-summary-panel/calls-summary-panel.component';
import { ServiceMetricsPanelComponent } from './components/service-metrics-panel/service-metrics-panel.component';
import { AgentRosterComponent } from './components/agent-roster/agent-roster.component';
import { QueuePanelComponent } from './components/queue-panel/queue-panel.component';
import { CallDirectionPanelComponent } from './components/call-direction-panel/call-direction-panel.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    CallsSummaryPanelComponent,
    ServiceMetricsPanelComponent,
    AgentRosterComponent,
    QueuePanelComponent,
    AgentOfMonthCardComponent,
    AgentStateDonutComponent,
    CallDirectionPanelComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly store = inject(DashboardStoreService);

  trackByQueueName(_index: number, queue: { name: string }): string {
    return queue.name;
  }
}
