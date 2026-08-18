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
  // The first tick's own tap()/catchError() moves it to 'live' or
  // 'stale'/'error' as soon as that request actually resolves.
  private readonly connectionState = new BehaviorSubject<ConnectionState>('connecting');
  private consecutiveFailures = 0;

  readonly connectionState$ = this.connectionState.asObservable();

  // pollIntervalMs comes from assets/config.json (via AppConfigService),
  // loaded once at app start by the APP_INITIALIZER in app.config.ts — see
  // CONFIGURATION.md for how to change it without a rebuild.
  //
  // exhaustMap, not switchMap: switchMap cancels the in-flight fetchSnapshot
  // whenever the next interval tick fires. One snapshot is a forkJoin of
  // several HTTP requests (see BffClientService) — any response slower than
  // pollIntervalMs used to be cancelled and re-started forever, never once
  // reaching catchError (a cancelled subscription isn't an error), so
  // consecutiveFailures never incremented and the board could sit on "Live"
  // indefinitely with genuinely stale data. exhaustMap instead ignores new
  // ticks while a fetch is still in flight, so every fetch either completes
  // or errors — paired with the timeout() below so a truly hung request
  // still frees the next tick instead of blocking forever.
  readonly updates$: Observable<DashboardSnapshot> = interval(this.appConfig.config().pollIntervalMs).pipe(
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
          this.connectionState.next(this.consecutiveFailures >= FAILURES_BEFORE_ERROR ? 'error' : 'stale');
          console.error('[PollingDataSource] fetch failed', err);
          return of(null);
        }),
      ),
    ),
    // Drops failed/timed-out ticks (catchError above turns them into `null`)
    // without ending the stream — the store simply receives no new snapshot
    // that tick, so whatever it already has (the last known good data)
    // stays on screen rather than being cleared. A typed filter() states
    // that plainly; the previous version did the same thing via
    // `switchMap(() => snapshot ? of(snapshot) : timer(0).pipe(switchMap(() => [])))`,
    // which took real effort to read for the same one-line effect.
    filter((snapshot): snapshot is DashboardSnapshot => snapshot !== null),
    takeUntil(this.destroy$),
  );

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
