import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { PollingDataSource } from './polling-data-source';
import { BffClientService } from './bff-client.service';
import { AppConfigService } from '../config/app-config.service';
import { AppConfig } from '../config/app-config.model';
import { ConnectionState } from './data-source.token';
import { DashboardSnapshot } from '../models/domain';

describe('PollingDataSource', () => {
  const dummySnapshot = {} as DashboardSnapshot;
  let fetchSnapshotSpy: jasmine.Spy;
  let dataSource: PollingDataSource;

  function setup(pollIntervalMs: number): void {
    const bffClientStub = { fetchSnapshot: () => of(dummySnapshot) };
    fetchSnapshotSpy = spyOn(bffClientStub, 'fetchSnapshot').and.callThrough();

    const appConfigStub = { config: () => ({ apiBaseUrl: 'x', pollIntervalMs }) as AppConfig };

    TestBed.configureTestingModule({
      providers: [
        PollingDataSource,
        { provide: BffClientService, useValue: bffClientStub },
        { provide: AppConfigService, useValue: appConfigStub },
      ],
    });
    dataSource = TestBed.inject(PollingDataSource);
  }

  afterEach(() => {
    // Stop the interval so no fakeAsync test leaks a pending periodic timer
    // into the next test.
    dataSource?.ngOnDestroy();
  });

  it('fetches immediately on subscribe rather than waiting a full interval', fakeAsync(() => {
    setup(1000);
    const snapshots: DashboardSnapshot[] = [];
    const sub = dataSource.updates$.subscribe((s) => snapshots.push(s));

    tick(0);
    expect(fetchSnapshotSpy).toHaveBeenCalledTimes(1);
    expect(snapshots.length).toBe(1);

    sub.unsubscribe();
  }));

  it('re-fetches on every poll interval tick', fakeAsync(() => {
    setup(1000);
    const sub = dataSource.updates$.subscribe();

    tick(0);
    tick(1000);
    tick(1000);
    expect(fetchSnapshotSpy).toHaveBeenCalledTimes(3);

    sub.unsubscribe();
  }));

  it('starts in the "connecting" connection state, not "live", before any fetch has resolved', () => {
    setup(1000);
    const states: ConnectionState[] = [];
    const sub = dataSource.connectionState$.subscribe((s) => states.push(s));
    expect(states).toEqual(['connecting']);
    sub.unsubscribe();
  });

  it('reports "stale" (not immediately "error") for the first two consecutive failures', fakeAsync(() => {
    setup(1000);
    fetchSnapshotSpy.and.callFake(() => throwError(() => new Error('boom')));

    const states: ConnectionState[] = [];
    const subState = dataSource.connectionState$.subscribe((s) => states.push(s));
    const subUpdates = dataSource.updates$.subscribe();

    tick(0); // failure #1
    tick(1000); // failure #2

    expect(states).toEqual(['connecting', 'stale', 'stale']);

    subState.unsubscribe();
    subUpdates.unsubscribe();
  }));

  it('escalates to "error" from the third consecutive failure onward', fakeAsync(() => {
    setup(1000);
    fetchSnapshotSpy.and.callFake(() => throwError(() => new Error('boom')));

    const states: ConnectionState[] = [];
    const subState = dataSource.connectionState$.subscribe((s) => states.push(s));
    const subUpdates = dataSource.updates$.subscribe();

    tick(0); // failure #1 -> stale
    tick(1000); // failure #2 -> stale
    tick(1000); // failure #3 -> error
    tick(1000); // failure #4 -> stays error

    expect(states).toEqual(['connecting', 'stale', 'stale', 'error', 'error']);

    subState.unsubscribe();
    subUpdates.unsubscribe();
  }));

  it('recovers to "live" and resumes emitting snapshots once a fetch succeeds again', fakeAsync(() => {
    setup(1000);
    let callCount = 0;
    fetchSnapshotSpy.and.callFake(() =>
      callCount++ < 2 ? throwError(() => new Error('boom')) : of(dummySnapshot),
    );

    const states: ConnectionState[] = [];
    const snapshots: DashboardSnapshot[] = [];
    const subState = dataSource.connectionState$.subscribe((s) => states.push(s));
    const subUpdates = dataSource.updates$.subscribe((s) => snapshots.push(s));

    tick(0); // failure -> stale
    tick(1000); // failure -> stale
    tick(1000); // success -> live

    expect(states).toEqual(['connecting', 'stale', 'stale', 'live']);
    // Only the one successful fetch should have produced a snapshot — the
    // two failed ticks must not leak a null/undefined value downstream.
    expect(snapshots.length).toBe(1);
    expect(snapshots[0]).toBe(dummySnapshot);

    subState.unsubscribe();
    subUpdates.unsubscribe();
  }));

  // Regression guard for the exact bug fixed by switching switchMap ->
  // exhaustMap: a fetch slower than the poll interval used to be cancelled
  // and silently restarted forever by the next tick, never reaching
  // catchError, so consecutiveFailures never rose and the board could sit on
  // "Live" indefinitely without ever actually receiving new data.
  it('does not cancel an in-flight fetch when the next poll tick fires (exhaustMap, not switchMap)', fakeAsync(() => {
    setup(1000);
    const slowFetch = new Subject<DashboardSnapshot>();
    fetchSnapshotSpy.and.callFake(() => slowFetch.asObservable());

    const snapshots: DashboardSnapshot[] = [];
    const sub = dataSource.updates$.subscribe((s) => snapshots.push(s));

    tick(0); // tick #1 starts the slow fetch
    tick(1000); // tick #2: a cancel-happy operator would abandon tick #1's fetch here
    tick(1000); // tick #3: same again

    // Only one fetch should ever have been started — later ticks are
    // ignored while the first is still outstanding.
    expect(fetchSnapshotSpy).toHaveBeenCalledTimes(1);

    slowFetch.next(dummySnapshot);
    slowFetch.complete();
    tick(0);

    // The original, never-cancelled fetch still delivers its result.
    expect(snapshots).toEqual([dummySnapshot]);

    sub.unsubscribe();
  }));

  // A fetch that never resolves at all (not even an HTTP error — just hangs)
  // must still eventually be treated as failed, or exhaustMap would ignore
  // every subsequent tick forever and the board would freeze on stale data
  // with no path back to "error" and no way to recover.
  it('times out a fetch that never resolves, so it does not block all future ticks forever', fakeAsync(() => {
    setup(1000);
    fetchSnapshotSpy.and.callFake(() => new Subject<DashboardSnapshot>().asObservable());
    spyOn(console, 'error');

    const states: ConnectionState[] = [];
    const subState = dataSource.connectionState$.subscribe((s) => states.push(s));
    const subUpdates = dataSource.updates$.subscribe();

    tick(0);
    tick(8000); // past FETCH_TIMEOUT_MS — the hung fetch should now error out

    expect(states).toEqual(['connecting', 'stale']);

    subState.unsubscribe();
    subUpdates.unsubscribe();
  }));

  it('does not emit onto updates$ for a failed fetch (errors are swallowed, not forwarded)', fakeAsync(() => {
    setup(1000);
    fetchSnapshotSpy.and.callFake(() => throwError(() => new Error('boom')));
    spyOn(console, 'error'); // PollingDataSource logs failures; keep test output clean

    let emittedCount = 0;
    const sub = dataSource.updates$.subscribe(() => emittedCount++);

    tick(0);
    tick(1000);
    expect(emittedCount).toBe(0);

    sub.unsubscribe();
  }));
});
