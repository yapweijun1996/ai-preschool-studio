// PWA update contract. UI code imports only from this module.
// Exported names/types are a contract with the UI worker: keep them stable.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  APPLY_TIMEOUT_MS,
  UPDATE_RELOAD_REFUSED,
  canApply,
  initialPwaState,
  pwaReducer,
  registrationFailedAction,
  shouldAutoApply,
  updateOffered,
  type ErrorKind,
  type PwaAction,
  type PwaState,
  type UnsupportedReason,
  type UpdateStatus
} from './machine';

export type { ErrorKind, UnsupportedReason, UpdateStatus } from './machine';
export {
  canApply,
  initialPwaState,
  pwaReducer,
  registrationFailedAction,
  shouldAutoApply,
  updateOffered,
  APPLY_TIMEOUT_MS,
  UPDATE_RELOAD_REFUSED,
  UPDATE_TIMED_OUT
} from './machine';
export type { PwaAction, PwaState } from './machine';

export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? '0.0.0-dev';
export const BUILD_ID: string = import.meta.env.VITE_BUILD_ID ?? 'dev';

export interface PwaApi {
  status: UpdateStatus;
  currentVersion: string;
  currentBuild: string;
  /** Version of the waiting release when status is 'available' or 'applying'; undefined if version.json was unreadable. */
  availableVersion?: string;
  lastChecked?: Date;
  error?: string;
  /** When status is 'error': whether a check (or registration) or installing an update failed. */
  errorKind?: ErrorKind;
  /** When status is 'unsupported': why. */
  unsupportedReason?: UnsupportedReason;
  /** Show the "Update" action: a release is waiting, or a failed install can be retried. */
  updateOffered: boolean;
  /** True while any screen holds unsaved work; updates never reload then. */
  hasDirtyWork: boolean;
  checkNow: () => Promise<void>;
  /** Activate the waiting release and reload once. No-op unless status is 'available'. */
  applyUpdate: () => void;
}

/** Read-only debug/test hook installed on window by PwaProvider. */
export interface PwaDebugHook {
  snapshot(): Pick<PwaApi, 'status' | 'currentVersion' | 'currentBuild' | 'availableVersion' | 'hasDirtyWork'>;
  apply(): void;
  check(): Promise<void>;
}

declare global {
  interface Window {
    __apsPwa?: PwaDebugHook;
  }
}

/** theme-color values; equal to --color-surface in tokens.css (light / dark). */
export const THEME_COLOR = { light: '#FFFFFF', dark: '#111A2B' } as const;
export function themeColorFor(theme: string | undefined): string {
  return theme === 'dark' ? THEME_COLOR.dark : THEME_COLOR.light;
}

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const RELOAD_KEY = 'aps-pwa-reload-at';
/** A second update reload within this window is treated as a loop and refused. */
const RELOAD_LOOP_WINDOW_MS = 30_000;

const fallback: PwaApi = {
  status: 'unsupported',
  currentVersion: APP_VERSION,
  currentBuild: BUILD_ID,
  updateOffered: false,
  hasDirtyWork: false,
  checkNow: async () => {},
  applyUpdate: () => {}
};

const Ctx = createContext<PwaApi>(fallback);
/** Registers one unit of unsaved work; returns its release function. */
const DirtyCtx = createContext<() => () => void>(() => () => {});

/** Why service workers cannot be used here, or undefined when they can. */
function swUnsupportedReason(): UnsupportedReason | undefined {
  if (!import.meta.env.PROD) return 'dev';
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return 'browser';
  if (!window.isSecureContext) return 'insecure';
  return undefined;
}

const messageOf = (e: unknown) => (e instanceof Error && e.message ? e.message : String(e || 'Update check failed'));

type VersionInfo = { version: string; build?: string };

async function fetchVersionInfoOnce(): Promise<VersionInfo | undefined> {
  try {
    const res = await fetch(`./version.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { version?: unknown; build?: unknown };
    if (typeof data.version !== 'string') return undefined;
    return { version: data.version, build: typeof data.build === 'string' ? data.build : undefined };
  } catch {
    return undefined;
  }
}

/** version.json of the newest deployed release; one retry, since a missing version must not read "v". */
async function fetchVersionInfo(): Promise<VersionInfo | undefined> {
  const first = await fetchVersionInfoOnce();
  if (first) return first;
  await new Promise((r) => setTimeout(r, 300));
  return fetchVersionInfoOnce();
}

/** Resolves once `worker` leaves 'installing' (or after `ms`). */
function settled(worker: ServiceWorker, ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (worker.state !== 'installing') return resolve();
    const done = () => {
      if (worker.state === 'installing') return;
      worker.removeEventListener('statechange', done);
      clearTimeout(t);
      resolve();
    };
    const t = setTimeout(() => {
      worker.removeEventListener('statechange', done);
      resolve();
    }, ms);
    worker.addEventListener('statechange', done);
  });
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const unsupportedReason = useMemo(swUnsupportedReason, []);
  const supported = !unsupportedReason;
  const [state, setState] = useState<PwaState>(() => initialPwaState(supported, unsupportedReason));
  const stateRef = useRef(state);
  const send = useCallback((action: PwaAction) => {
    const next = pwaReducer(stateRef.current, action);
    if (next !== stateRef.current) {
      stateRef.current = next;
      setState(next);
    }
  }, []);

  // ---- dirty-work guard (ref-counted) ----
  const [dirtyCount, setDirtyCount] = useState(0);
  const dirtyRef = useRef(0);
  const addDirty = useCallback(() => {
    let released = false;
    dirtyRef.current += 1;
    setDirtyCount(dirtyRef.current);
    return () => {
      if (released) return;
      released = true;
      dirtyRef.current -= 1;
      setDirtyCount(dirtyRef.current);
    };
  }, []);
  const hasDirtyWork = dirtyCount > 0;

  useEffect(() => {
    if (!hasDirtyWork) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasDirtyWork]);

  // ---- theme-color follows <html data-theme> ----
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      const color = themeColorFor(root.dataset.theme);
      if (meta.content !== color) meta.content = color;
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  // ---- service worker + update state machine ----
  // Single-flight registration: in flight or succeeded. Cleared after a failure so the next check retries.
  const regRef = useRef<Promise<ServiceWorkerRegistration | undefined> | undefined>(undefined);
  const disposedRef = useRef(false);
  const hadControllerRef = useRef(false);
  const applyingRef = useRef(false); // duplicate-apply guard (sync, before React re-renders)
  const silentRef = useRef(false); // activating a waiting worker for the release already running
  const staleRef = useRef(false); // another tab activated a newer release under this page
  const reloadingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inflightRef = useRef<Promise<void> | undefined>(undefined);

  const reloadOnce = useCallback(() => {
    if (reloadingRef.current) return;
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      if (last && Date.now() - last < RELOAD_LOOP_WINDOW_MS) {
        clearTimeout(timeoutRef.current);
        applyingRef.current = false;
        // The new release already controls this page (SKIP_WAITING went through) but the page
        // still runs the old one: it is stale, so later checks must report 'available', not 'current'.
        staleRef.current = true;
        send({ type: 'apply-failed', message: UPDATE_RELOAD_REFUSED, pending: true });
        return;
      }
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      /* storage blocked: the in-memory guard still prevents duplicate reloads */
    }
    reloadingRef.current = true;
    clearTimeout(timeoutRef.current);
    window.location.reload();
  }, [send]);

  /** A worker is waiting behind an existing controller: decide whether it is an update. */
  const onWaiting = useCallback(
    async (reg: ServiceWorkerRegistration) => {
      const info = await fetchVersionInfo();
      const waiting = reg.waiting;
      if (!waiting || !navigator.serviceWorker.controller) return;
      if (info && info.version === APP_VERSION && info.build === BUILD_ID) {
        // The page already runs this release (network-first navigation fetched it); only the
        // worker lags behind. Activate it quietly — no reload, nothing for the user to do.
        silentRef.current = true;
        waiting.postMessage({ type: 'SKIP_WAITING' });
        send({ type: 'check-done', waiting: false, at: new Date() });
        return;
      }
      send({ type: 'check-done', waiting: true, at: new Date() });
      if (info) send({ type: 'version', version: info.version });
    },
    [send]
  );

  /**
   * Registers sw.js once; concurrent callers share the attempt. A failed attempt is reported and
   * forgotten, so the next check (Retry, Settings, online, visible, hourly) registers again.
   */
  const ensureRegistration = useCallback((): Promise<ServiceWorkerRegistration | undefined> => {
    if (regRef.current) return regRef.current;
    // Callbacks run asynchronously (after regRef holds `attempt`), even if register() throws synchronously.
    const attempt: Promise<ServiceWorkerRegistration | undefined> = Promise.resolve()
      .then(() => navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }))
      .then(
        (reg) => {
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (!disposedRef.current && worker.state === 'installed' && navigator.serviceWorker.controller && reg.waiting === worker) void onWaiting(reg);
            });
          });
          return reg;
        },
        (e: unknown) => {
          if (regRef.current === attempt) regRef.current = undefined;
          send(registrationFailedAction(e, new Date()));
          return undefined;
        }
      );
    regRef.current = attempt;
    return attempt;
  }, [send, onWaiting]);

  const checkNow = useCallback((): Promise<void> => {
    if (!supported || stateRef.current.status === 'unsupported') return Promise.resolve();
    if (inflightRef.current) return inflightRef.current;
    const run = (async () => {
      try {
        if (navigator.onLine === false) {
          send({ type: 'offline', at: new Date() });
          return;
        }
        send({ type: 'check-start' });
        const reg = await ensureRegistration();
        if (!reg) return; // registration failed and was reported; the next check tries again
        await reg.update();
        if (reg.installing && navigator.serviceWorker.controller) await settled(reg.installing, 60_000);
        if (staleRef.current) {
          send({ type: 'update-found' });
          return;
        }
        if (reg.waiting && navigator.serviceWorker.controller) await onWaiting(reg);
        else send({ type: 'check-done', waiting: false, at: new Date() });
      } catch (e) {
        if (navigator.onLine === false) send({ type: 'offline', at: new Date() });
        else send({ type: 'check-failed', message: messageOf(e), at: new Date() });
      }
    })().finally(() => {
      inflightRef.current = undefined;
    });
    inflightRef.current = run;
    return run;
  }, [supported, send, onWaiting, ensureRegistration]);

  /** After a failed install: is there still something to install (waiting worker or stale page)? */
  const stillPending = useCallback(async () => {
    if (staleRef.current) return true;
    try {
      const reg = await regRef.current;
      return !!reg?.waiting;
    } catch {
      return false;
    }
  }, []);

  const applyUpdate = useCallback(() => {
    if (applyingRef.current || reloadingRef.current) return;
    if (!canApply(stateRef.current, dirtyRef.current > 0)) return;
    applyingRef.current = true;
    send({ type: 'apply', dirty: false });
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      applyingRef.current = false;
      void stillPending().then((pending) => send({ type: 'apply-timeout', pending }));
    }, APPLY_TIMEOUT_MS);
    void (async () => {
      try {
        const reg = await regRef.current;
        if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        else if (staleRef.current) reloadOnce(); // already controlled by the new release
        // otherwise: nothing to activate; the timeout reports the failure
      } catch (e) {
        clearTimeout(timeoutRef.current);
        applyingRef.current = false;
        send({ type: 'apply-failed', message: messageOf(e), pending: await stillPending() });
      }
    })();
  }, [send, reloadOnce, stillPending]);

  useEffect(() => {
    if (!supported) return;
    let sw: ServiceWorkerContainer;
    try {
      sw = navigator.serviceWorker; // throws SecurityError in some browsers when storage is blocked
    } catch (e) {
      send(registrationFailedAction(e, new Date()));
      return;
    }
    hadControllerRef.current = !!sw.controller;
    let disposed = false;
    disposedRef.current = false;

    const onControllerChange = () => {
      if (disposed) return;
      if (!hadControllerRef.current) {
        hadControllerRef.current = true; // first install claimed the page: not an update
        return;
      }
      if (silentRef.current) {
        silentRef.current = false;
        return;
      }
      if (applyingRef.current) {
        reloadOnce();
        return;
      }
      // Another tab activated a newer release; this page still runs the old one.
      staleRef.current = true;
      send({ type: 'update-found' });
      void fetchVersionInfo().then((info) => info && send({ type: 'version', version: info.version }));
    };
    sw.addEventListener('controllerchange', onControllerChange);

    void ensureRegistration().then((reg) => {
      if (disposed || !reg) return;
      if (reg.waiting && sw.controller) void onWaiting(reg);
      void checkNow();
    });

    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkNow();
    };
    const onOnline = () => void checkNow();
    const onOffline = () => send({ type: 'offline', at: new Date() });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const timer = setInterval(() => void checkNow(), CHECK_INTERVAL_MS);

    return () => {
      disposed = true;
      disposedRef.current = true;
      sw.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(timer);
      clearTimeout(timeoutRef.current);
    };
  }, [supported, send, checkNow, onWaiting, reloadOnce, ensureRegistration]);

  // ---- safe-idle auto update: only while the tab is hidden and nothing is dirty ----
  const [visibility, setVisibility] = useState<DocumentVisibilityState>(() =>
    typeof document === 'undefined' ? 'visible' : document.visibilityState
  );
  useEffect(() => {
    const on = () => setVisibility(document.visibilityState);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  useEffect(() => {
    if (shouldAutoApply(state, hasDirtyWork, visibility) && document.visibilityState === 'hidden') applyUpdate();
  }, [state, hasDirtyWork, visibility, applyUpdate]);

  const api = useMemo<PwaApi>(
    () => ({
      status: state.status,
      currentVersion: APP_VERSION,
      currentBuild: BUILD_ID,
      availableVersion: state.availableVersion,
      lastChecked: state.lastChecked,
      error: state.error,
      errorKind: state.status === 'error' ? state.errorKind : undefined,
      unsupportedReason: state.status === 'unsupported' ? (state.unsupportedReason ?? unsupportedReason) : undefined,
      updateOffered: updateOffered(state),
      hasDirtyWork,
      checkNow,
      applyUpdate
    }),
    [state, unsupportedReason, hasDirtyWork, checkNow, applyUpdate]
  );

  // ---- read-only debug/test hook ----
  useEffect(() => {
    const hook: PwaDebugHook = {
      snapshot: () => ({
        status: stateRef.current.status,
        currentVersion: APP_VERSION,
        currentBuild: BUILD_ID,
        availableVersion: stateRef.current.availableVersion,
        hasDirtyWork: dirtyRef.current > 0
      }),
      apply: () => applyUpdate(),
      check: () => checkNow()
    };
    window.__apsPwa = hook;
    return () => {
      if (window.__apsPwa === hook) delete window.__apsPwa;
    };
  }, [applyUpdate, checkNow]);

  return (
    <DirtyCtx.Provider value={addDirty}>
      <Ctx.Provider value={api}>{children}</Ctx.Provider>
    </DirtyCtx.Provider>
  );
}

export function usePwa(): PwaApi {
  return useContext(Ctx);
}

/** Screens with unsaved work call this so an update never reloads over a draft. */
export function useDirtyGuard(dirty: boolean): void {
  const addDirty = useContext(DirtyCtx);
  useEffect(() => {
    if (!dirty) return;
    return addDirty();
  }, [dirty, addDirty]);
}
