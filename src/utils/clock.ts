import { TODAY } from '../data/demo';

const DEMO_SESSION_START_KEY = 'aps-demo-clock-started-at';
const DEMO_START = Date.parse(`${TODAY}T09:00:00+08:00`);
let lastElapsed = 0;
let memorySessionStart: number | undefined;

function sessionStartedAt(fallback: number): number {
  try {
    const stored = window.sessionStorage.getItem(DEMO_SESSION_START_KEY);
    const parsed = stored === null ? NaN : Number(stored);
    if (Number.isFinite(parsed)) {
      memorySessionStart = parsed;
      return parsed;
    }
    memorySessionStart ??= fallback;
    window.sessionStorage.setItem(DEMO_SESSION_START_KEY, String(fallback));
  } catch { /* Storage can be unavailable in privacy-restricted contexts. */ }
  memorySessionStart ??= fallback;
  return memorySessionStart;
}

/** Resets the shared demo timeline to start at the next clock read. */
export function resetDemoClock(): void {
  const startedAt = Date.now();
  memorySessionStart = startedAt;
  try { window.sessionStorage.setItem(DEMO_SESSION_START_KEY, String(startedAt)); }
  catch { /* The clock remains usable when storage is unavailable. */ }
  lastElapsed = 0;
}

/** Demo time is one session-wide timeline, anchored at 09:00 Singapore time. */
export function demoNow(wallClock: () => Date = () => new Date()): Date {
  const instant = wallClock();
  const startedAt = sessionStartedAt(instant.getTime());
  const elapsed = Math.max(lastElapsed, instant.getTime() - startedAt);
  lastElapsed = elapsed;
  return new Date(DEMO_START + elapsed);
}

/** Current instant for persisted events; injectable so callers can make time deterministic. */
export function now(clock: () => Date = demoNow): string {
  return clock().toISOString();
}

export function asInstant(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : new Date(value).toISOString();
}
