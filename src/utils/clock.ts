import { TODAY } from '../data/demo';

/** Current instant for persisted events; injectable so callers can make time deterministic. */
export function now(clock: () => Date = () => new Date()): string {
  return clock().toISOString();
}

/** Demo attendance follows the seeded business date and Singapore wall-clock time of day. */
export function demoNow(wallClock: () => Date = () => new Date()): Date {
  const instant = wallClock();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(`${TODAY}T${values.hour}:${values.minute}:${values.second}.${String(instant.getMilliseconds()).padStart(3, '0')}+08:00`);
}

export function asInstant(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : new Date(value).toISOString();
}
