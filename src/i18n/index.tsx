import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Dict } from './locales/en';

export type Lang = 'en' | 'zh' | 'ms';

export const LANGS: { key: Lang; label: string; short: string; htmlLang: string; intl: string }[] = [
  { key: 'en', label: 'English', short: 'EN', htmlLang: 'en', intl: 'en-GB' },
  { key: 'zh', label: '中文', short: '中文', htmlLang: 'zh-Hans', intl: 'zh-CN' },
  { key: 'ms', label: 'Bahasa Melayu', short: 'BM', htmlLang: 'ms', intl: 'ms-MY' }
];

const KEY = 'aps-lang';

// Dotted key paths of the English dictionary, e.g. "common.status.draft".
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Paths<Dict>;
export type TVars = Record<string, string | number>;

function lookup(dict: unknown, key: string): string | undefined {
  let cur: unknown = dict;
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(s: string, vars?: TVars) {
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

export function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'en' || v === 'zh' || v === 'ms') return v;
  } catch {
    /* ignore */
  }
  // Default English regardless of browser language; the user switches explicitly.
  return 'en';
}

export async function loadDict(lang: Lang): Promise<Dict> {
  if (lang === 'en') return (await import('./locales/en')).en;
  if (lang === 'zh') return (await import('./locales/zh')).zh;
  if (lang === 'ms') return (await import('./locales/ms')).ms;
  throw new Error(`Unsupported language: ${lang}`);
}

export async function loadInitialLanguage(): Promise<{ lang: Lang; dict: Dict }> {
  const lang = readLang();
  return { lang, dict: await loadDict(lang) };
}

export interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  loadingLang: boolean;
  requestedLang: Lang | null;
  /** Translate; `{name}` placeholders are filled from vars. With `count`, a `<key>_one` variant is used when count === 1. */
  t: (key: TKey, vars?: TVars) => string;
  /** Locale-aware date, e.g. 22 Oct 2026 / 2026年10月22日 / 22 Okt 2026. */
  fmtDate: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
  /** Locale-aware 24h time HH:MM. */
  fmtTime: (d: Date) => string;
}

const Ctx = createContext<I18n | null>(null);

export function makeT(_lang: Lang, dict: Dict) {
  return (key: TKey, vars?: TVars) => {
    let k: string = key;
    if (vars && vars.count === 1 && lookup(dict, `${key}_one`) !== undefined) k = `${key}_one`;
    const s = lookup(dict, k) ?? key;
    return interpolate(s, vars);
  };
}

export function I18nProvider({ children, initial, initialDict }: { children: ReactNode; initial?: Lang; initialDict?: Dict }) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? readLang());
  const [dict, setDict] = useState<Dict | undefined>(initialDict);
  const [loadingLang, setLoadingLang] = useState(false);
  const [requestedLang, setRequestedLang] = useState<Lang | null>(null);
  const languageRequest = useRef(0);
  const languageIndicator = useRef<number | undefined>(undefined);
  const meta = LANGS.find((l) => l.key === lang)!;
  useEffect(() => {
    document.documentElement.lang = meta.htmlLang;
  }, [meta.htmlLang]);
  const setLang = useCallback((l: Lang) => {
    if (l === lang) return;
    const requestId = ++languageRequest.current;
    if (languageIndicator.current !== undefined) window.clearTimeout(languageIndicator.current);
    languageIndicator.current = window.setTimeout(() => { setRequestedLang(l); setLoadingLang(true); }, 40);
    void Promise.all([loadDict(l), new Promise((resolve) => window.setTimeout(resolve, 180))]).then(([next]) => {
      if (requestId !== languageRequest.current) return;
      setDict(next);
      setLangState(l);
      try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
    }).finally(() => {
      if (requestId !== languageRequest.current) return;
      if (languageIndicator.current !== undefined) window.clearTimeout(languageIndicator.current);
      languageIndicator.current = undefined;
      setLoadingLang(false);
      setRequestedLang(null);
    });
  }, [lang]);
  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      loadingLang,
      requestedLang,
      t: makeT(lang, dict!),
      fmtDate: (iso, opts) => new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString(meta.intl, opts ?? { day: 'numeric', month: 'short', year: 'numeric' }),
      fmtTime: (d) => d.toLocaleTimeString(meta.intl, { hour: '2-digit', minute: '2-digit', hour12: false })
    }),
    [lang, dict, setLang, loadingLang, requestedLang, meta.intl]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside I18nProvider');
  return v;
}
