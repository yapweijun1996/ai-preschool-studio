const RELOAD_KEY = 'aps-chunk-reload-attempted';

const CHUNK_ERROR_MESSAGE = /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i;

/** True only for the browser errors emitted when a lazy module cannot be downloaded. */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return CHUNK_ERROR_MESSAGE.test(error.message);
}

function hasDirtyWork(): boolean {
  try {
    return window.__apsPwa?.snapshot().hasDirtyWork ?? false;
  } catch {
    return false;
  }
}

/** Reload once after a stale or unavailable code-split chunk. */
export function reloadForChunkFailure(): boolean {
  if (hasDirtyWork()) return false;
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === 'true') return false;
    sessionStorage.setItem(RELOAD_KEY, 'true');
  } catch {
    // If storage is unavailable, avoid an unguarded reload loop.
    return false;
  }
  window.location.reload();
  return true;
}

export function clearChunkReloadAttempt(): void {
  try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* ignore */ }
}

export function installChunkFailureRecovery(): void {
  // Route preload errors flow into the route boundary. Reloading from Vite's global preload
  // event races pointer intent: a failed hover preload can reload before navigation commits.
  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) reloadForChunkFailure();
  });
}
