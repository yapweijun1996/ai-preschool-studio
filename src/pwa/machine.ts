// Pure update state machine behind usePwa(). No DOM or service-worker access here, so every
// transition is unit-testable (tests/pwa.test.ts). Side effects live in PwaProvider.

export type UpdateStatus =
  | 'unsupported' // no service worker (dev server, old browser)
  | 'checking'
  | 'current' // up to date
  | 'available' // new version installed and waiting
  | 'applying' // user (or safe-idle policy) chose to update; show the loader
  | 'offline'
  | 'error';

export interface PwaState {
  status: UpdateStatus;
  availableVersion?: string;
  lastChecked?: Date;
  error?: string;
}

export type PwaAction =
  | { type: 'unsupported' }
  | { type: 'check-start' }
  /** A check finished; `waiting` is true when a new release is installed and waiting. */
  | { type: 'check-done'; waiting: boolean; at: Date }
  | { type: 'check-failed'; message: string; at: Date }
  | { type: 'offline'; at?: Date }
  /** A waiting release was detected outside a check (updatefound, other tab activated one). */
  | { type: 'update-found' }
  | { type: 'version'; version: string }
  | { type: 'apply'; dirty: boolean }
  | { type: 'apply-timeout' }
  | { type: 'apply-failed'; message: string };

export const APPLY_TIMEOUT_MS = 10_000;
export const UPDATE_TIMED_OUT = 'Update timed out';

export function initialPwaState(supported: boolean): PwaState {
  return { status: supported ? 'checking' : 'unsupported' };
}

/** applyUpdate() acts only from 'available' and never over unsaved work. */
export function canApply(state: PwaState, dirty: boolean): boolean {
  return state.status === 'available' && !dirty;
}

/** Safe-idle policy: update automatically only when nothing is dirty and the user is away. */
export function shouldAutoApply(state: PwaState, dirty: boolean, visibility: DocumentVisibilityState | string): boolean {
  return canApply(state, dirty) && visibility === 'hidden';
}

// While a release is waiting (or being applied) checks and connectivity changes must not hide it.
const holds = (s: PwaState) => s.status === 'available' || s.status === 'applying';

export function pwaReducer(state: PwaState, action: PwaAction): PwaState {
  if (state.status === 'unsupported') return state;
  switch (action.type) {
    case 'unsupported':
      return { status: 'unsupported' };
    case 'check-start':
      return holds(state) || state.status === 'checking' ? state : { ...state, status: 'checking', error: undefined };
    case 'check-done':
      if (state.status === 'applying') return state;
      return action.waiting
        ? { ...state, status: 'available', lastChecked: action.at, error: undefined }
        : { status: 'current', lastChecked: action.at };
    case 'check-failed':
      if (holds(state)) return { ...state, lastChecked: action.at };
      return { ...state, status: 'error', error: action.message, lastChecked: action.at };
    case 'offline':
      if (holds(state)) return state;
      return { ...state, status: 'offline', error: undefined, lastChecked: action.at ?? state.lastChecked };
    case 'update-found':
      return state.status === 'applying' ? state : { ...state, status: 'available', error: undefined };
    case 'version':
      return state.availableVersion === action.version ? state : { ...state, availableVersion: action.version };
    case 'apply':
      return canApply(state, action.dirty) ? { ...state, status: 'applying', error: undefined } : state;
    case 'apply-timeout':
      return state.status === 'applying' ? { ...state, status: 'error', error: UPDATE_TIMED_OUT } : state;
    case 'apply-failed':
      return state.status === 'applying' ? { ...state, status: 'error', error: action.message } : state;
  }
}
