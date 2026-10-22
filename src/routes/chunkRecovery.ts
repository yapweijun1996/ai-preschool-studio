const RELOAD_KEY = 'aps-chunk-reload-attempted';

/** Reload once after a stale or unavailable code-split chunk. */
export function reloadForChunkFailure(): boolean {
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
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadForChunkFailure();
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof Error && /import|fetch|load/i.test(`${event.reason.name} ${event.reason.message}`)) {
      reloadForChunkFailure();
    }
  });
}
