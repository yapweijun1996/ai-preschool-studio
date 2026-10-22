// PWA update contract. UI code imports only from this module.
// CONTRACT STUB written by the manager: the PWA worker replaces the implementation
// but must keep every exported name and type stable.
import { createContext, useContext, useEffect, type ReactNode } from 'react';

export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? '0.0.0-dev';
export const BUILD_ID: string = import.meta.env.VITE_BUILD_ID ?? 'dev';

export type UpdateStatus =
  | 'unsupported' // no service worker (dev server, old browser)
  | 'checking'
  | 'current' // up to date
  | 'available' // new version installed and waiting
  | 'applying' // user (or safe-idle policy) chose to update; show the loader
  | 'offline'
  | 'error';

export interface PwaApi {
  status: UpdateStatus;
  currentVersion: string;
  currentBuild: string;
  /** Version of the waiting release when status is 'available' or 'applying'. */
  availableVersion?: string;
  lastChecked?: Date;
  error?: string;
  /** True while any screen holds unsaved work; updates never reload then. */
  hasDirtyWork: boolean;
  checkNow: () => Promise<void>;
  /** Activate the waiting release and reload once. No-op unless status is 'available'. */
  applyUpdate: () => void;
}

const fallback: PwaApi = {
  status: 'unsupported',
  currentVersion: APP_VERSION,
  currentBuild: BUILD_ID,
  hasDirtyWork: false,
  checkNow: async () => {},
  applyUpdate: () => {}
};

const Ctx = createContext<PwaApi>(fallback);

export function PwaProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={fallback}>{children}</Ctx.Provider>;
}

export function usePwa(): PwaApi {
  return useContext(Ctx);
}

/** Screens with unsaved work call this so an update never reloads over a draft. */
export function useDirtyGuard(dirty: boolean): void {
  useEffect(() => {
    void dirty;
  }, [dirty]);
}
