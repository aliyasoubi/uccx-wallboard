import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  interval,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSnapshot } from '../models/domain';
import { BffClientService } from './bff-client.service';
import { ConnectionState, DataSource } from './data-source.token';

// Phase 1 implementation of DataSource (see README §4/§9 for the
// WebSocketDataSource that replaces this later behind the same interface).
@Injectable()
export class PollingDataSource implements DataSource, OnDestroy {
  private readonly bffClient = inject(BffClientService);
  private readonly destroy$ = new Subject<void>();
  private readonly connectionState = new BehaviorSubject<ConnectionState>('live');
  private consecutiveFailures = 0;

  readonly connectionState$ = this.connectionState.asObservable();

  readonly updates$: Observable<DashboardSnapshot> = interval(environment.pollIntervalMs).pipe(
    startWith(0),
    switchMap(() =>
      this.bffClient.fetchSnapshot().pipe(
        tap(() => {
          this.consecutiveFailures = 0;
          this.connectionState.next('live');
        }),
        catchError((err) => {
          this.consecutiveFailures++;
          this.connectionState.next(this.consecutiveFailures >= 3 ? 'error' : 'stale');
          console.error('[PollingDataSource] fetch failed', err);
          return of(null);
        }),
      ),
    ),
    // filter out failed ticks without ending the stream
    switchMap((snapshot) => (snapshot ? of(snapshot) : timer(0).pipe(switchMap(() => [])))),
    takeUntil(this.destroy$),
  );

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
