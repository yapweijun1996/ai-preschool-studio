import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { initialState, reducer, type Action, type State } from './reducer';

const STORAGE_KEY = 'aps-demo-state-v1';

function load(): State {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    // Storage can be unavailable (private mode); the demo still works in memory.
  }
  return initialState();
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function PortfolioProvider({ children, initial }: { children: ReactNode; initial?: State }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initial ?? load());
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
