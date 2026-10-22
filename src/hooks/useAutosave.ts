import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = { kind: 'saved'; at: string } | { kind: 'unsaved' } | { kind: 'saving' } | { kind: 'failed' };

const timeLabel = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/**
 * Debounced autosave for the demo. `persist` commits the value; `shouldFail`
 * simulates a network failure so the "Save failed · Retry" state is reachable.
 */
export function useAutosave<T>(value: T, persist: (v: T) => void, shouldFail: boolean, initialAt = '10:42') {
  const [status, setStatus] = useState<SaveStatus>({ kind: 'saved', at: initialAt });
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
    setStatus({ kind: 'saving' });
    timers.current.push(
      window.setTimeout(() => {
        if (shouldFail) {
          setStatus({ kind: 'failed' });
        } else {
          persist(latest.current);
          setStatus({ kind: 'saved', at: timeLabel() });
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
    setStatus({ kind: 'unsaved' });
    timers.current.push(window.setTimeout(save, 800));
    return clear;
    // Only value changes should schedule a save.
  }, [value]);

  return { status, retry: save };
}
