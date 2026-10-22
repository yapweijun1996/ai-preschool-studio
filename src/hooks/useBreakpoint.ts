import { useEffect, useState } from 'react';

// Breakpoints from the design system README: ≥1200 desktop, 768–1199 tablet, <768 mobile.
export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

function current(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w >= 1200) return 'desktop';
  if (w >= 768) return 'tablet';
  return 'mobile';
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(current);
  useEffect(() => {
    const onResize = () => setBp(current());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return bp;
}
