import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSnapshot } from '../models/domain';

// 'connecting' is the state before the first request resolves — the board
// hasn't shown "Live" yet because nothing has actually loaded. Previously
// the connection state defaulted straight to 'live' with zero data, which
// meant a slow or unreachable backend showed a false "all clear" on first
// paint. Distinct from 'stale' (was live, hasn't heard back in a while).
export type ConnectionState = 'connecting' | 'live' | 'stale' | 'error';

// The store depends on this interface only. Swapping the polling
// implementation for a WebSocket one later means providing a different
// class for this token — nothing else in the app changes.
export interface DataSource {
  readonly updates$: Observable<DashboardSnapshot>;
  readonly connectionState$: Observable<ConnectionState>;
}

export const DATA_SOURCE = new InjectionToken<DataSource>('DATA_SOURCE');
