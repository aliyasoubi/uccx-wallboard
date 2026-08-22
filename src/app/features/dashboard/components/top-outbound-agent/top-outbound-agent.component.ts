import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CallDirection,
  TOP_AGENT_ICON_COLOR_VARS,
  TOP_AGENT_ICONS,
  TOP_AGENT_TITLES,
  TopAgentBase,
} from '../top-agent-base/top-agent-base';

// Module 3, "Top Outbound Agent" — see TopAgentBase for why this and
// TopInboundAgentComponent are separate modules sharing tracker logic.
@Component({
  selector: 'app-top-outbound-agent',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: '../top-agent-base/top-agent-base.html',
  styleUrl: '../top-agent-base/top-agent-base.scss',
})
export class TopOutboundAgentComponent extends TopAgentBase {
  protected readonly direction: CallDirection = 'outbound';
  readonly title = TOP_AGENT_TITLES.outbound;
  readonly icon = TOP_AGENT_ICONS.outbound;
  readonly iconColorVar = TOP_AGENT_ICON_COLOR_VARS.outbound;
}
