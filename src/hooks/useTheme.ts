import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePref = Theme | 'system';
const KEY = 'aps-theme';

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  // Design system default is Light; System applies only when the user picks it.
  return 'light';
}

const systemDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export function useTheme() {
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [sysDark, setSysDark] = useState<boolean>(systemDark);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const on = () => setSysDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const theme: Theme = pref === 'system' ? (sysDark ? 'dark' : 'light') : pref;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    try {
      localStorage.setItem(KEY, p);
    } catch {
      /* ignore */
    }
  }, []);
  return { pref, theme, setPref };
}
