import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const RoutePendingContext = createContext(false);
export const useRoutePending = () => useContext(RoutePendingContext);

/** Tracks in-app hash navigation and exposes feedback only when it lasts beyond a brief delay. */
export function RoutePendingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const clear = () => {
      window.clearTimeout(timer.current);
      timer.current = undefined;
      setPending(false);
    };
    const begin = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!target || target.target || target.hasAttribute('download')) return;
      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash.startsWith('#/')) return;
      const nextPath = url.hash.slice(1);
      if (nextPath === window.location.hash.slice(1)) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setPending(true), 150);
    };
    document.addEventListener('click', begin, true);
    window.addEventListener('route-content-ready', clear);
    return () => {
      document.removeEventListener('click', begin, true);
      window.removeEventListener('route-content-ready', clear);
      window.clearTimeout(timer.current);
    };
  }, []);

  return <RoutePendingContext.Provider value={pending}>
    {children}
    {pending && <div className="route-pending" aria-hidden="true" data-testid="route-pending"><span /></div>}
  </RoutePendingContext.Provider>;
}
