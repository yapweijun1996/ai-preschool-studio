import { useCallback, useEffect, useRef, useState } from 'react';
import { TODAY } from '../data/demo';
import { useI18n } from '../i18n';

/** `at` is the save time already formatted for the current language (HH:MM). */
export type SaveStatus = { kind: 'saved'; at: string } | { kind: 'unsaved' } | { kind: 'saving' } | { kind: 'failed' };

type InnerStatus = { kind: 'saved'; at: Date } | { kind: 'unsaved' } | { kind: 'saving' } | { kind: 'failed' };

/**
 * Debounced autosave for the demo. `persist` commits the value; `shouldFail`
 * simulates a network failure so the "Save failed · Retry" state is reachable.
 * The save time is kept as a Date and formatted with fmtTime at render, so it
 * follows the current language.
 */
export function useAutosave<T>(value: T, persist: (v: T) => void, shouldFail: boolean, initialAt = '10:42') {
  const { fmtTime } = useI18n();
  const [inner, setInner] = useState<InnerStatus>(() => ({ kind: 'saved', at: new Date(`${TODAY}T${initialAt}:00`) }));
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
