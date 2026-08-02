import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CallDirection,
  TOP_AGENT_ICON_COLOR_VARS,
  TOP_AGENT_ICONS,
  TOP_AGENT_TITLES,
  TopAgentBase,
} from '../top-agent-base/top-agent-base';

// Module 3, "Top Outbound Agent" — a separate component module from
// TopInboundAgentComponent (own selector/file/spec), sharing only the
// tracker-wiring logic via TopAgentBase. See top-agent-base.ts for why.
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
