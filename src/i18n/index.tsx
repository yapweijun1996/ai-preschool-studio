import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type Dict } from './locales/en';
import { ms } from './locales/ms';
import { zh } from './locales/zh';

export type Lang = 'en' | 'zh' | 'ms';

export const LANGS: { key: Lang; label: string; short: string; htmlLang: string; intl: string }[] = [
  { key: 'en', label: 'English', short: 'EN', htmlLang: 'en', intl: 'en-GB' },
  { key: 'zh', label: '中文', short: '中文', htmlLang: 'zh-Hans', intl: 'zh-CN' },
  { key: 'ms', label: 'Bahasa Melayu', short: 'BM', htmlLang: 'ms', intl: 'ms-MY' }
];

const DICTS: Record<Lang, Dict> = { en, zh, ms };
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

function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'en' || v === 'zh' || v === 'ms') return v;
  } catch {
    /* ignore */
  }
  // Default English regardless of browser language; the user switches explicitly.
  return 'en';
}

/** Formats an ISO approval timestamp using the same locale and template as ReportPreview. */
export function formatApprovalAt(iso: string): string {
  const lang = readLang();
  const meta = LANGS.find((item) => item.key === lang)!;
  const date = new Date(iso);
  const dateLabel = date.toLocaleDateString(meta.intl, { day: 'numeric', month: 'short', year: 'numeric' });
  const timeLabel = date.toLocaleTimeString(meta.intl, { hour: '2-digit', minute: '2-digit', hour12: false });
  return makeT(lang)('pages.report.approvedAt', { date: dateLabel, time: timeLabel });
}

export interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate; `{name}` placeholders are filled from vars. With `count`, a `<key>_one` variant is used when count === 1. */
  t: (key: TKey, vars?: TVars) => string;
  /** Locale-aware date, e.g. 22 Oct 2026 / 2026年10月22日 / 22 Okt 2026. */
  fmtDate: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
  /** Locale-aware 24h time HH:MM. */
  fmtTime: (d: Date) => string;
}

const Ctx = createContext<I18n | null>(null);

export function makeT(lang: Lang) {
  return (key: TKey, vars?: TVars) => {
    const dict = DICTS[lang];
    let k: string = key;
    if (vars && vars.count === 1 && lookup(dict, `${key}_one`) !== undefined) k = `${key}_one`;
    const s = lookup(dict, k) ?? lookup(en, k) ?? key;
    return interpolate(s, vars);
  };
}

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? readLang());
  const meta = LANGS.find((l) => l.key === lang)!;
  useEffect(() => {
    document.documentElement.lang = meta.htmlLang;
  }, [meta.htmlLang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      t: makeT(lang),
      fmtDate: (iso, opts) => new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString(meta.intl, opts ?? { day: 'numeric', month: 'short', year: 'numeric' }),
      fmtTime: (d) => d.toLocaleTimeString(meta.intl, { hour: '2-digit', minute: '2-digit', hour12: false })
    }),
    [lang, setLang, meta.intl]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside I18nProvider');
  return v;
}
