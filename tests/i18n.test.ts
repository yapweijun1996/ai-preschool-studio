import { describe, expect, it } from 'vitest';
import { makeT, type TKey } from '../src/i18n';
import { en } from '../src/i18n/locales/en';
import { ms } from '../src/i18n/locales/ms';
import { zh } from '../src/i18n/locales/zh';

type Tree = { [k: string]: string | Tree };

/** Flatten a dictionary into dotted key → string. */
function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

const placeholders = (s: string) => [...new Set(Array.from(s.matchAll(/\{(\w+)\}/g), (m) => m[1]))].sort();

const EN = flatten(en as unknown as Tree);

describe.each([
  ['zh', zh],
  ['ms', ms]
])('%s dictionary', (_name, dict) => {
  const flat = flatten(dict as unknown as Tree);

  it('has exactly the same keys as English', () => {
    expect(Object.keys(flat).sort()).toEqual(Object.keys(EN).sort());
  });

  it('has no empty strings', () => {
    const empty = Object.entries(flat).filter(([, v]) => v.trim() === '').map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it('uses the same {placeholders} as English for every key', () => {
    const mismatched = Object.keys(EN)
      .filter((k) => k in flat && placeholders(flat[k]).join(',') !== placeholders(EN[k]).join(','))
      .map((k) => `${k}: en[${placeholders(EN[k])}] vs [${placeholders(flat[k])}]`);
    expect(mismatched).toEqual([]);
  });
});

describe('English dictionary', () => {
  it('has no empty strings', () => {
    expect(Object.entries(EN).filter(([, v]) => v.trim() === '')).toEqual([]);
  });
});

describe('makeT', () => {
  it('interpolates {vars}', () => {
    const t = makeT('en');
    expect(t('pages.dashboard.greeting', { name: 'Ms. Lim' })).toBe('Good morning, Ms. Lim');
    expect(makeT('zh')('pages.dashboard.greeting', { name: 'Ms. Lim' })).toBe('早上好，Ms. Lim');
  });

  it('uses the _one variant only when count is 1', () => {
    const t = makeT('en');
    expect(t('pages.shared.observations', { count: 1 })).toBe('1 observation');
    expect(t('pages.shared.observations', { count: 0 })).toBe('0 observations');
    expect(t('pages.shared.observations', { count: 2 })).toBe('2 observations');
    expect(t('pages.shared.lastObservedDays', { count: 1 })).toBe('Last observed 1 day ago');
    expect(t('pages.shared.lastObservedDays', { count: 16 })).toBe('Last observed 16 days ago');
    expect(t('pages.shared.claims', { count: 1 })).toBe('1 claim needs teacher verification');
    expect(t('pages.shared.claims', { count: 2 })).toBe('2 claims need teacher verification');
    expect(makeT('ms')('pages.shared.observations', { count: 1 })).toBe('1 pemerhatian');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(makeT('en')('pages.dashboard.greeting')).toBe('Good morning, {name}');
  });

  it('falls back to English when a key is missing in the current language', () => {
    const key = 'pages.dashboard.greeting';
    const zhPages = zh.pages.dashboard as Record<string, string>;
    const saved = zhPages.greeting;
    delete zhPages.greeting;
    try {
      expect(makeT('zh')(key, { name: 'Ms. Lim' })).toBe('Good morning, Ms. Lim');
    } finally {
      zhPages.greeting = saved;
    }
  });

  it('returns the key itself when no language has it', () => {
    expect(makeT('ms')('pages.nope.missing' as TKey)).toBe('pages.nope.missing');
  });
});
