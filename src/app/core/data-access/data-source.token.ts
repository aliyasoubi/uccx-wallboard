import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSnapshot } from '../models/domain';

export type ConnectionState = 'live' | 'stale' | 'error';

// The store depends on this interface only. Swapping the polling
// implementation for a WebSocket one later means providing a different
// class for this token — nothing else in the app changes.
export interface DataSource {
  readonly updates$: Observable<DashboardSnapshot>;
  readonly connectionState$: Observable<ConnectionState>;
}

export const DATA_SOURCE = new InjectionToken<DataSource>('DATA_SOURCE');
