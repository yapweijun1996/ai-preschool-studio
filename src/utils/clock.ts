/** Current instant for persisted events; injectable so callers can make time deterministic. */
export function now(clock: () => Date = () => new Date()): string {
  return clock().toISOString();
}

export function asInstant(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : new Date(value).toISOString();
}
