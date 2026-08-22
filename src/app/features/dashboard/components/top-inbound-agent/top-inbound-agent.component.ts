import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CallDirection,
  TOP_AGENT_ICON_COLOR_VARS,
  TOP_AGENT_ICONS,
  TOP_AGENT_TITLES,
  TopAgentBase,
} from '../top-agent-base/top-agent-base';

// Module 2, "Top Inbound Agent" — see TopAgentBase for why this and
// TopOutboundAgentComponent are separate modules sharing tracker logic.
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
  readonly icon = TOP_AGENT_ICONS.inbound;
  readonly iconColorVar = TOP_AGENT_ICON_COLOR_VARS.inbound;
}
