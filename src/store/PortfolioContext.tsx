import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from 'react';
import { STUDENTS } from '../data/demo';
import { createDemoAdapter } from '../data/demoAdapter';
import type { DataPort } from '../data/port';
import { initialState, reducer, type Action, type State } from './reducer';

// Bump SCHEMA whenever the seeded data or the state shape changes: a tab that updates the app
// (PWA reload) must not resume demo state saved by an older build.
const SCHEMA = 4;
const STORAGE_KEY = 'aps-demo-state';
const LEGACY_KEYS = ['aps-demo-state-v1'];

export const serializeState = (state: State) => JSON.stringify({ schema: SCHEMA, state });

/** Parse stored demo state; anything from another schema, or missing a current student, starts fresh. */
export function loadState(raw: string | null): State {
  if (!raw) return initialState();
  try {
    const parsed = JSON.parse(raw) as { schema?: number; state?: State };
    const s = parsed?.state;
    const complete =
      !!s &&
      Array.isArray(s.observations) &&
      typeof s.paragraphs === 'object' && s.paragraphs !== null &&
      typeof s.reflections === 'object' && s.reflections !== null &&
      typeof s.sim === 'object' && s.sim !== null &&
      typeof s.nextObsNumber === 'number' &&
      STUDENTS.every((st) => s.reports?.[st.id]?.status);
    if (parsed?.schema === SCHEMA && complete) return s;
  } catch {
    /* corrupt entry: start fresh */
  }
  return initialState();
}

function load(): State {
  try {
    for (const k of LEGACY_KEYS) sessionStorage.removeItem(k);
    return loadState(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be unavailable (private mode); the demo still works in memory.
    return initialState();
  }
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function PortfolioProvider({ children, initial }: { children: ReactNode; initial?: State }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initial ?? load());
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function usePortfolio() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePortfolio must be used inside PortfolioProvider');
  return v;
}

/** Returns a stable adapter whose reads always use the latest provider state. */
export function useDataPort(): DataPort {
  const { state, dispatch } = usePortfolio();
  const stateRef = useRef(state);
  stateRef.current = state;
  return useMemo(() => createDemoAdapter(() => stateRef.current, dispatch), [dispatch]);
}
