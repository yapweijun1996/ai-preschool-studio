import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

// Per-device sidebar memory: pinned students and the last five students opened.
const PIN_KEY = 'aps-pinned';
const RECENT_KEY = 'aps-recent';
const RECENT_MAX = 5;

function read(key: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

function write(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

interface NavMemory {
  pinned: string[];
  recent: string[];
  isPinned: (id: string) => boolean;
  togglePin: (id: string) => void;
  visit: (id: string) => void;
}

const Ctx = createContext<NavMemory | null>(null);

export function NavMemoryProvider({ children }: { children: ReactNode }) {
  const [pinned, setPinned] = useState(() => read(PIN_KEY, ['aria']));
  const [recent, setRecent] = useState(() => read(RECENT_KEY, ['rayan', 'ethan', 'meiling']));

  const togglePin = useCallback((id: string) => {
    setPinned((p) => {
      const next = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      write(PIN_KEY, next);
      return next;
    });
  }, []);

  const visit = useCallback((id: string) => {
    setRecent((r) => {
      if (r[0] === id) return r;
      const next = [id, ...r.filter((x) => x !== id)].slice(0, RECENT_MAX);
      write(RECENT_KEY, next);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ pinned, recent, isPinned: (id) => pinned.includes(id), togglePin, visit }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNavMemory() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNavMemory must be used inside NavMemoryProvider');
  return v;
}

/** Records a student page visit for the sidebar's Recent list. */
export function useVisit(id: string, valid: boolean) {
  const { visit } = useNavMemory();
  useEffect(() => {
    if (valid) visit(id);
  }, [id, valid, visit]);
}
