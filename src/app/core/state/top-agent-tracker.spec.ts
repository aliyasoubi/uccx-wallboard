import { TOP_AGENT_RESET_INTERVAL_MS, TopAgentTracker } from './top-agent-tracker';

describe('TopAgentTracker', () => {
  const STORAGE_KEY_PREFIX = 'test:top-agent-tracker:';
  let key: string;
  let clockMs: number;
  const now = () => clockMs;

  beforeEach(() => {
    key = `${STORAGE_KEY_PREFIX}${Math.random()}`;
    clockMs = Date.parse('2026-07-21T08:00:00Z');
    localStorage.removeItem(key);
  });

  afterEach(() => {
    localStorage.removeItem(key);
  });

  it('starts with no tracked leader', () => {
    const tracker = new TopAgentTracker(key, now);
    expect(tracker.top()).toBeNull();
  });

  it('tracks the agent with the highest value on the first evaluation', () => {
    const tracker = new TopAgentTracker(key, now);
    tracker.evaluate([
      { id: 'A1', name: 'John', value: 20 },
      { id: 'A2', name: 'Sarah', value: 26 },
      { id: 'A3', name: 'Michael', value: 12 },
    ]);
    expect(tracker.top()).toEqual({ agentId: 'A2', agentName: 'Sarah', value: 26 });
  });

  it('raises the max when a later tick exceeds it', () => {
    const tracker = new TopAgentTracker(key, now);
    tracker.evaluate([{ id: 'A1', name: 'John', value: 20 }]);
    tracker.evaluate([{ id: 'A1', name: 'John', value: 25 }]);
    expect(tracker.top()?.value).toBe(25);
  });

  it('does NOT lower the max when a later tick reports a smaller value ("dynamic max" semantics)', () => {
    const tracker = new TopAgentTracker(key, now);
    tracker.evaluate([{ id: 'A1', name: 'John', value: 30 }]);
    tracker.evaluate([{ id: 'A1', name: 'John', value: 5 }]);
    expect(tracker.top()?.value).toBe(30);
  });

  it('switches the tracked leader if a different agent later exceeds the max', () => {
    const tracker = new TopAgentTracker(key, now);
    tracker.evaluate([{ id: 'A1', name: 'John', value: 20 }]);
    tracker.evaluate([{ id: 'A1', name: 'John', value: 20 }, { id: 'A2', name: 'Sarah', value: 35 }]);
    expect(tracker.top()).toEqual({ agentId: 'A2', agentName: 'Sarah', value: 35 });
  });

  it('ignores an empty agent list rather than clearing the tracked max', () => {
    const tracker = new TopAgentTracker(key, now);
    tracker.evaluate([{ id: 'A1', name: 'John', value: 20 }]);
    tracker.evaluate([]);
    expect(tracker.top()?.value).toBe(20);
  });

  it('resets to null once the 24-hour window elapses', () => {
    const tracker = new TopAgentTracker(key, now);
    tracker.evaluate([{ id: 'A1', name: 'John', value: 20 }]);
    expect(tracker.top()).not.toBeNull();

    clockMs += TOP_AGENT_RESET_INTERVAL_MS + 1;
    tracker.evaluate([{ id: 'A1', name: 'John', value: 3 }]);

    // After reset, the new tick's value (3) becomes the fresh max — not 20.
    expect(tracker.top()?.value).toBe(3);
  });

  it('does not reset before the 24-hour window elapses', () => {
    const tracker = new TopAgentTracker(key, now);
    tracker.evaluate([{ id: 'A1', name: 'John', value: 20 }]);

    clockMs += TOP_AGENT_RESET_INTERVAL_MS - 1000;
    tracker.evaluate([{ id: 'A1', name: 'John', value: 5 }]);

    expect(tracker.top()?.value).toBe(20);
  });

  it('persists the running max across instances via localStorage (survives a page refresh)', () => {
    const first = new TopAgentTracker(key, now);
    first.evaluate([{ id: 'A1', name: 'John', value: 42 }]);

    const second = new TopAgentTracker(key, now);
    expect(second.top()?.value).toBe(42);
  });

  it('keeps each tracker instance isolated when given different storage keys', () => {
    const inbound = new TopAgentTracker(`${key}:inbound`, now);
    const outbound = new TopAgentTracker(`${key}:outbound`, now);

    inbound.evaluate([{ id: 'A1', name: 'John', value: 50 }]);
    outbound.evaluate([{ id: 'A1', name: 'John', value: 5 }]);

    expect(inbound.top()?.value).toBe(50);
    expect(outbound.top()?.value).toBe(5);

    localStorage.removeItem(`${key}:inbound`);
    localStorage.removeItem(`${key}:outbound`);
  });
});
