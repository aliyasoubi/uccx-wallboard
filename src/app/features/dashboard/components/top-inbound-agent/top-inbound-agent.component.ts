import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CallDirection, TOP_AGENT_TITLES, TopAgentBase } from '../top-agent-base/top-agent-base';

// Module 2, "Top Inbound Agent" — a standalone module in its own right
// (own selector, own file, own spec), not one component parameterized by
// a direction input. Shares its tracker-wiring logic with
// TopOutboundAgentComponent via TopAgentBase — see that file for why the
// logic is centralized while the two are still genuinely separate modules.
@Component({
  selector: 'app-top-inbound-agent',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: '../top-agent-base/top-agent-base.html',
  styleUrl: '../top-agent-base/top-agent-base.scss',
})
export class TopInboundAgentComponent extends TopAgentBase {
  protected readonly direction: CallDirection = 'inbound';
  readonly title = TOP_AGENT_TITLES.inbound;
}
