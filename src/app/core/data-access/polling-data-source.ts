import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  exhaustMap,
  filter,
  interval,
  Observable,
  of,
  startWith,
  Subject,
  takeUntil,
  tap,
  timeout,
} from 'rxjs';
import { DashboardSnapshot } from '../models/domain';
import { AppConfigService } from '../config/app-config.service';
import { BffClientService } from './bff-client.service';
import { ConnectionState, DataSource } from './data-source.token';

// A fetch that runs longer than this is treated as failed and the slot
// freed up for the next poll tick, rather than left to hang indefinitely.
// Comfortably longer than the default 3s poll interval so a single slow
// response doesn't trip it, but short enough that a genuinely stuck
// connection surfaces as 'stale'/'error' within a few ticks.
const FETCH_TIMEOUT_MS = 8000;

// Consecutive failed/timed-out ticks before escalating from 'stale' to
// 'error' — a couple of missed beats reads as a blip, not an outage.
const FAILURES_BEFORE_ERROR = 3;

// Phase 1 implementation of DataSource (see README §4/§9 for the
// WebSocketDataSource that replaces this later behind the same interface).
@Injectable()
export class PollingDataSource implements DataSource, OnDestroy {
  private readonly bffClient = inject(BffClientService);
  private readonly appConfig = inject(AppConfigService);
  private readonly destroy$ = new Subject<void>();
  // Starts 'connecting', not 'live' — see the ConnectionState doc comment.
  private readonly connectionState = new BehaviorSubject<ConnectionState>('connecting');
  private consecutiveFailures = 0;

  readonly connectionState$ = this.connectionState.asObservable();

  // exhaustMap, not switchMap: switchMap cancels the in-flight fetchSnapshot
  // whenever the next interval tick fires. A response slower than
  // pollIntervalMs used to be cancelled and re-started forever, never
  // reaching catchError (a cancelled subscription isn't an error), so
  // consecutiveFailures never incremented and the board could sit on "Live"
  // with genuinely stale data. exhaustMap ignores new ticks while a fetch is
  // in flight instead, so every fetch either completes or errors — paired
  // with timeout() below so a hung request still frees the next tick.
  readonly updates$: Observable<DashboardSnapshot> = interval(
    this.appConfig.config().pollIntervalMs,
  ).pipe(
    startWith(0),
    exhaustMap(() =>
      this.bffClient.fetchSnapshot().pipe(
        timeout(FETCH_TIMEOUT_MS),
        tap(() => {
          this.consecutiveFailures = 0;
          this.connectionState.next('live');
        }),
        catchError((err) => {
          this.consecutiveFailures++;
          this.connectionState.next(
            this.consecutiveFailures >= FAILURES_BEFORE_ERROR ? 'error' : 'stale',
          );
          console.error('[PollingDataSource] fetch failed', err);
          return of(null);
        }),
      ),
    ),
    // Drops failed/timed-out ticks (catchError above turns them into `null`)
    // without ending the stream, so the store simply keeps whatever
    // last-known-good snapshot it already has instead of it being cleared.
    filter((snapshot): snapshot is DashboardSnapshot => snapshot !== null),
    takeUntil(this.destroy$),
  );

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
