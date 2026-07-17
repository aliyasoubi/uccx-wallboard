import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { DashboardStoreService } from '../../core/state/dashboard-store.service';
import { AgentOfMonthCardComponent, AgentStateDonutComponent } from '../../shared/components';
import { CallsSummaryPanelComponent } from './components/calls-summary-panel/calls-summary-panel.component';
import { ServiceMetricsPanelComponent } from './components/service-metrics-panel/service-metrics-panel.component';
import { AgentRosterComponent } from './components/agent-roster/agent-roster.component';
import { QueuePanelComponent } from './components/queue-panel/queue-panel.component';
import { CallDirectionPanelComponent } from './components/call-direction-panel/call-direction-panel.component';
import { ShiftMetricsPanelComponent } from './components/shift-metrics-panel/shift-metrics-panel.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    TranslocoModule,
    CallsSummaryPanelComponent,
    ServiceMetricsPanelComponent,
    AgentRosterComponent,
    QueuePanelComponent,
    AgentOfMonthCardComponent,
    AgentStateDonutComponent,
    CallDirectionPanelComponent,
    ShiftMetricsPanelComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly store = inject(DashboardStoreService);
  private readonly transloco = inject(TranslocoService);

  trackByQueueName(_index: number, queue: { name: string }): string {
    return queue.name;
  }

  setLang(lang: 'en' | 'fa'): void {
    this.transloco.setActiveLang(lang);
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}
