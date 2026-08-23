import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Agent } from '../../../../core/models/domain';
import { TopInboundAgentComponent } from '../top-inbound-agent/top-inbound-agent.component';
import { TopOutboundAgentComponent } from '../top-outbound-agent/top-outbound-agent.component';

// Presentational shell that puts Top Inbound Agent and Top Outbound Agent
// side by side inside ONE card, per the client's layout reference.
//
// Deliberately a wrapper, not a merge: TopInboundAgentComponent and
// TopOutboundAgentComponent remain two separate components with their own
// selectors, files and specs (see TopAgentBase for why). Only the card chrome
// moved up here — the children now render as bare columns.
@Component({
  selector: 'app-top-agents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopInboundAgentComponent, TopOutboundAgentComponent],
  templateUrl: './top-agents.component.html',
  styleUrl: './top-agents.component.scss',
})
export class TopAgentsComponent {
  readonly agents = input<Agent[]>([]);
}
