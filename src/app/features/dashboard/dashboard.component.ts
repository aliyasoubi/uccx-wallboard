import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
// Multi-language disabled for this release — see app.config.ts for how to
// re-enable. TranslocoModule import and setLang() removed from here too.
import { DashboardStoreService } from '../../core/state/dashboard-store.service';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { CallSummaryDisplaysComponent } from './components/call-summary-displays/call-summary-displays.component';
import { KpiMetricsComponent } from './components/kpi-metrics/kpi-metrics.component';
import { SlaGaugeComponent } from './components/sla-gauge/sla-gauge.component';
import { CustomerSatisfactionGaugeComponent } from './components/customer-satisfaction-gauge/customer-satisfaction-gauge.component';
import { AgentOfMonthComponent } from './components/agent-of-month/agent-of-month.component';
import { AgentStateComponent } from './components/agent-state/agent-state.component';
import { AgentSummaryComponent } from './components/agent-summary/agent-summary.component';
import { QueueListComponent } from './components/queue-list/queue-list.component';
import { TopAgentsComponent } from './components/top-agents/top-agents.component';

// The dashboard shell: reads the store and composes every module. Owns no
// business logic of its own (no HTTP, no thresholds, no aggregation) — that
// all lives in core/. See dashboard.component.scss for the layout.
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    FooterComponent,
    CallSummaryDisplaysComponent,
    KpiMetricsComponent,
    SlaGaugeComponent,
    CustomerSatisfactionGaugeComponent,
    TopAgentsComponent,
    AgentOfMonthComponent,
    AgentStateComponent,
    AgentSummaryComponent,
    QueueListComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly store = inject(DashboardStoreService);
}
