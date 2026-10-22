import { useEffect, useState } from 'react';

// Breakpoints from the design system README: ≥1200 desktop, 768–1199 tablet, <768 mobile.
export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

/** Up to this width (tablet portrait and 1024 landscape) the shell uses the bottom tab bar instead of the rail. */
export const BOTTOM_TABS_MAX = 1024;

function current(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w >= 1200) return 'desktop';
  if (w >= 768) return 'tablet';
  return 'mobile';
}

function useWidthValue<T>(read: () => T): T {
  const [v, setV] = useState<T>(read);
  useEffect(() => {
    const onResize = () => setV(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [read]);
  return v;
}

const bottomTabs = () => typeof window !== 'undefined' && window.innerWidth <= BOTTOM_TABS_MAX;

export function useBreakpoint(): Breakpoint {
  return useWidthValue(current);
}

/** True when the shell navigates with the bottom tab bar (phones and tablets up to 1024px). */
export function useBottomTabs(): boolean {
  return useWidthValue(bottomTabs);
}
