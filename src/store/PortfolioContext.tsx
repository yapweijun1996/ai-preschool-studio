import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from 'react';
import { STUDENTS } from '../data/demo';
import { createDemoAdapter } from '../data/demoAdapter';
import type { DataPort } from '../data/port';
import { initialState, reducer, reportContentHash, type Action, type State } from './reducer';

// Bump SCHEMA whenever the seeded data or the state shape changes: a tab that updates the app
// (PWA reload) must not resume demo state saved by an older build.
const SCHEMA = 10;
const STORAGE_KEY = 'aps-demo-state';
const LEGACY_KEYS = ['aps-demo-state-v1'];
const isIsoInstant = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(value) && !Number.isNaN(Date.parse(value));

export const serializeState = (state: State) => JSON.stringify({ schema: SCHEMA, state });

/** Parse stored demo state; anything from another schema, or missing a current student, starts fresh. */
export function loadState(raw: string | null): State {
  if (!raw) return initialState();
  try {
    const parsed = JSON.parse(raw) as { schema?: number; state?: State };
    const s = parsed?.state;
    const string = (value: unknown): value is string => typeof value === 'string';
    const guardianShape = (guardian: unknown): boolean => !!guardian && typeof guardian === 'object' &&
      string((guardian as Record<string, unknown>).id) && Array.isArray((guardian as Record<string, unknown>).childIds) &&
      ((guardian as Record<string, unknown>).childIds as unknown[]).every((id) => string(id)) &&
      ['name', 'relationship', 'phone', 'email', 'preferredLanguage'].every((key) => string((guardian as Record<string, unknown>)[key])) &&
      typeof (guardian as Record<string, unknown>).isPrimary === 'boolean';
    const collectorShape = (collector: unknown): boolean => !!collector && typeof collector === 'object' &&
      ['id', 'childId', 'name', 'relationship', 'validFrom', 'note'].every((key) => string((collector as Record<string, unknown>)[key])) &&
      ((collector as Record<string, unknown>).validTo === undefined || string((collector as Record<string, unknown>).validTo));
    const complete =
      !!s &&
      Array.isArray(s.observations) &&
      typeof s.paragraphs === 'object' && s.paragraphs !== null &&
      typeof s.reflections === 'object' && s.reflections !== null &&
      typeof s.sim === 'object' && s.sim !== null &&
      typeof s.nextObsNumber === 'number' &&
      typeof s.nextGuardianNumber === 'number' && typeof s.nextCollectorNumber === 'number' &&
      Array.isArray(s.auditEvents) && typeof s.nextAuditNumber === 'number' &&
      Array.isArray(s.classes) && typeof s.children === 'object' && s.children !== null &&
      Array.isArray(s.guardians) && Array.isArray(s.collectors) &&
      STUDENTS.every((student) => !!s.children[student.id]) &&
      s.guardians.every(guardianShape) && s.collectors.every(collectorShape) &&
      s.auditEvents.every((event) => isIsoInstant(event.at) && (!event.decision || (isIsoInstant(event.decision.at) && event.decision.at === event.at))) &&
      STUDENTS.every((st) => s.reports?.[st.id]?.status) &&
      STUDENTS.every((st) => Array.isArray(s.reports[st.id].versions)) &&
      STUDENTS.every((st) => {
        const report = s.reports[st.id];
        const versions = report.versions;
        const requiresVersion = report.status === 'approved' || report.releasedVersion !== undefined;
        const releasedVersionValid = report.releasedVersion === undefined || versions.some((version) =>
          version.version === report.releasedVersion && !!version.releasedAt
        );
        const hashesValid = versions.every((version) => version.contentHash === reportContentHash(
          version.paragraphs,
          version.reflection,
          version.frameworkVersion,
          version.milestones
        ));
        return (!requiresVersion || versions.length > 0) && releasedVersionValid && hashesValid;
      }) &&
      STUDENTS.every((st) => s.reports?.[st.id]?.status !== 'review' || isIsoInstant(s.reports[st.id].submittedAt));
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

type PortfolioContextValue = { state: State; dispatch: Dispatch<Action>; dataPort: DataPort };
const Ctx = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children, initial }: { children: ReactNode; initial?: State }) {
  const [state, reactDispatch] = useReducer(reducer, undefined, () => initial ?? load());
  const latest = useRef(state);
  const dispatch = useMemo<Dispatch<Action>>(() => (action) => {
    latest.current = reducer(latest.current, action);
    reactDispatch(action);
  }, [reactDispatch]);
  const dataPort = useMemo(() => createDemoAdapter(() => latest.current, dispatch), [dispatch]);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch, dataPort }}>{children}</Ctx.Provider>;
}

export function usePortfolio() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePortfolio must be used inside PortfolioProvider');
  return v;
}

/** Returns a stable adapter whose reads always use the latest provider state. */
export function useDataPort(): DataPort {
  return usePortfolio().dataPort;
}
