// Pure update state machine behind usePwa(). No DOM or service-worker access here, so every
// transition is unit-testable (tests/pwa.test.ts). Side effects live in PwaProvider.

export type UpdateStatus =
  | 'unsupported' // no service worker (dev server, old browser, storage blocked)
  | 'checking'
  | 'current' // up to date
  | 'available' // new version installed and waiting
  | 'applying' // user (or safe-idle policy) chose to update; show the loader
  | 'offline'
  | 'error';

/**
 * Why updates are unsupported:
 * - dev: development build (no service worker by design)
 * - browser: production build, but this browser has no service workers
 * - insecure: production build served over plain http (service workers need a secure context)
 * - blocked: the browser refused registration with a SecurityError (e.g. cookies/storage blocked)
 */
export type UnsupportedReason = 'dev' | 'browser' | 'insecure' | 'blocked';

/** What failed when status is 'error': a check (or registration), or installing an update. */
export type ErrorKind = 'check' | 'apply';

export interface PwaState {
  status: UpdateStatus;
  availableVersion?: string;
  lastChecked?: Date;
  error?: string;
  errorKind?: ErrorKind;
  /** After an apply failure: the new release is still waiting (or the page is stale), so it can be retried. */
  updatePending?: boolean;
  unsupportedReason?: UnsupportedReason;
  /** Increments on every failure so the UI can tell a repeated identical error from a dismissed one. */
  errorSeq?: number;
}

export type PwaAction =
  | { type: 'unsupported'; reason?: UnsupportedReason }
  | { type: 'check-start' }
  /** A check finished; `waiting` is true when a new release is installed and waiting. */
  | { type: 'check-done'; waiting: boolean; at: Date }
  | { type: 'check-failed'; message: string; at: Date }
  | { type: 'offline'; at?: Date }
  /** A waiting release was detected outside a check (updatefound, other tab activated one). */
  | { type: 'update-found' }
  | { type: 'version'; version: string }
  | { type: 'apply'; dirty: boolean }
  /** `pending`: a release is still waiting (or the page runs a replaced release) after the failure. */
  | { type: 'apply-timeout'; pending?: boolean }
  | { type: 'apply-failed'; message: string; pending?: boolean };

export const APPLY_TIMEOUT_MS = 10_000;
export const UPDATE_TIMED_OUT = 'Update timed out';
export const UPDATE_RELOAD_REFUSED = 'Update reload loop prevented; reload the page manually';

export function initialPwaState(supported: boolean, reason?: UnsupportedReason): PwaState {
  if (supported) return { status: 'checking' };
  return reason ? { status: 'unsupported', unsupportedReason: reason } : { status: 'unsupported' };
}

/** An install failed but the new release is still there to install. */
const retryableApply = (s: PwaState) => s.status === 'error' && s.errorKind === 'apply' && s.updatePending === true;

/** The UI offers "Update" (button, banner, Settings): a release waits, or a failed install can be retried. */
export function updateOffered(state: PwaState): boolean {
  return state.status === 'available' || retryableApply(state);
}

/** applyUpdate() acts only while an update is offered and never over unsaved work. */
export function canApply(state: PwaState, dirty: boolean): boolean {
  return updateOffered(state) && !dirty;
}

/**
 * Safe-idle policy: update automatically only when nothing is dirty and the user is away.
 * Only from 'available'. After a failed install, a later background check may re-offer the
 * release and retry it once per check while the tab stays hidden; the reload-loop guard still
 * applies, so this can never become a loop.
 */
export function shouldAutoApply(state: PwaState, dirty: boolean, visibility: DocumentVisibilityState | string): boolean {
  return state.status === 'available' && canApply(state, dirty) && visibility === 'hidden';
}

const messageOf = (e: unknown) => (e instanceof Error && e.message ? e.message : String(e || 'Update check failed'));

/**
 * Maps a service-worker failure to an action. Only a SecurityError thrown by the
 * navigator.serviceWorker getter itself means the browser blocks workers (storage blocked):
 * that is 'unsupported'. register() also rejects with SecurityError for a wrong MIME type or a
 * redirected sw.js (captive portal, proxy, deploy in progress), which is transient: retryable.
 */
export function registrationFailedAction(e: unknown, at: Date, source: 'container' | 'register' = 'register'): PwaAction {
  const name = typeof e === 'object' && e !== null && 'name' in e ? (e as { name?: unknown }).name : undefined;
  if (source === 'container' && name === 'SecurityError') return { type: 'unsupported', reason: 'blocked' };
  return { type: 'check-failed', message: messageOf(e), at };
}

// While a release is waiting (or being applied) checks and connectivity changes must not hide it.
const holds = (s: PwaState) => s.status === 'available' || s.status === 'applying';

const applyError = (state: PwaState, message: string, pending: boolean | undefined): PwaState => ({
  ...state,
  status: 'error',
  error: message,
  errorKind: 'apply',
  updatePending: pending === true,
  errorSeq: (state.errorSeq ?? 0) + 1
});

/** Leaves the error state: drops error, errorKind and updatePending. */
const clean = ({ error: _e, errorKind: _k, updatePending: _p, ...rest }: PwaState): PwaState => rest;

export function pwaReducer(state: PwaState, action: PwaAction): PwaState {
  if (state.status === 'unsupported') return state;
  switch (action.type) {
    case 'unsupported':
      return action.reason ? { status: 'unsupported', unsupportedReason: action.reason } : { status: 'unsupported' };
    case 'check-start':
      if (holds(state) || state.status === 'checking') return state;
      // Retrying after a failed install re-offers the still-waiting update.
      if (retryableApply(state)) return { ...clean(state), status: 'available' };
      return { ...clean(state), status: 'checking' };
    case 'check-done':
      if (state.status === 'applying') return state;
      return action.waiting
        ? { ...clean(state), status: 'available', lastChecked: action.at }
        : { status: 'current', lastChecked: action.at };
    case 'check-failed':
      if (holds(state)) return { ...state, lastChecked: action.at };
      return { ...state, status: 'error', error: action.message, errorKind: 'check', updatePending: undefined, lastChecked: action.at, errorSeq: (state.errorSeq ?? 0) + 1 };
    case 'offline':
      if (holds(state) || retryableApply(state)) return state;
      return { ...clean(state), status: 'offline', lastChecked: action.at ?? state.lastChecked };
    case 'update-found':
      return state.status === 'applying' ? state : { ...clean(state), status: 'available' };
    case 'version':
      return state.availableVersion === action.version ? state : { ...state, availableVersion: action.version };
    case 'apply':
      return canApply(state, action.dirty) ? { ...clean(state), status: 'applying' } : state;
    case 'apply-timeout':
      return state.status === 'applying' ? applyError(state, UPDATE_TIMED_OUT, action.pending) : state;
    case 'apply-failed':
      return state.status === 'applying' ? applyError(state, action.message, action.pending) : state;
  }
}
