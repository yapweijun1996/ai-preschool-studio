import { useCallback, useEffect, useRef, useState } from 'react';
import { TODAY } from '../data/demo';
import { useI18n } from '../i18n';

/** `at` is the save time already formatted for the current language (HH:MM). */
/** `idle`: nothing has been saved yet in this session, so no save time is shown. */
export type SaveStatus = { kind: 'idle' } | { kind: 'saved'; at: string } | { kind: 'unsaved' } | { kind: 'saving' } | { kind: 'failed' };

type InnerStatus = { kind: 'idle' } | { kind: 'saved'; at: Date } | { kind: 'unsaved' } | { kind: 'saving' } | { kind: 'failed' };

/**
 * Debounced autosave for the demo. `persist` commits the value; `shouldFail`
 * simulates a network failure so the "Save failed · Retry" state is reachable.
 * The save time is kept as a Date and formatted with fmtTime at render, so it
 * follows the current language.
 */
export function useAutosave<T>(value: T, persist: (v: T) => void, shouldFail: boolean, initialAt = '10:42', startSaved = true) {
  const { fmtTime } = useI18n();
  // Seeded content shows its demo save time; empty content shows nothing until the first real save.
  const [inner, setInner] = useState<InnerStatus>(() => (startSaved ? { kind: 'saved', at: new Date(`${TODAY}T${initialAt}:00`) } : { kind: 'idle' }));
  const first = useRef(true);
  const timers = useRef<number[]>([]);
  const latest = useRef(value);
  latest.current = value;

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const save = useCallback(() => {
    clear();
    setInner({ kind: 'saving' });
    timers.current.push(
      window.setTimeout(() => {
        if (shouldFail) {
          setInner({ kind: 'failed' });
        } else {
          persist(latest.current);
          setInner({ kind: 'saved', at: new Date() });
        }
      }, 700)
    );
  }, [persist, shouldFail]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    clear();
    setInner({ kind: 'unsaved' });
    timers.current.push(window.setTimeout(save, 800));
    return clear;
    // Only value changes should schedule a save.
  }, [value]);

  const status: SaveStatus = inner.kind === 'saved' ? { kind: 'saved', at: fmtTime(inner.at) } : inner;
  return { status, retry: save };
}
