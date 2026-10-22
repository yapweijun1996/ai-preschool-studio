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
    expect(makeT('en')('pages.reviews.waiting', { count: 1 })).toBe('1 day waiting');
    expect(makeT('zh')('pages.reviews.waiting', { count: 1 })).toBe('已等待 1 天');
    expect(makeT('ms')('pages.reviews.waiting', { count: 1 })).toBe('Menunggu selama 1 hari');
  });

  it('labels changes-requested dates separately from submission dates', () => {
    expect(makeT('en')('pages.reviews.changesRequestedOn', { date: '22 Oct 2026' })).toBe('Changes requested 22 Oct 2026');
    expect(makeT('zh')('pages.reviews.changesRequestedOn', { date: '22 Oct 2026' })).not.toBe(makeT('en')('pages.reviews.changesRequestedOn', { date: '22 Oct 2026' }));
    expect(makeT('ms')('pages.reviews.changesRequestedOn', { date: '22 Oct 2026' })).not.toBe(makeT('en')('pages.reviews.changesRequestedOn', { date: '22 Oct 2026' }));
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

describe('translated defaults and fallbacks', () => {
  it('the prefilled request-changes note is translated, with the domain filled in', () => {
    const en = makeT('en')('pages.report.defaultChangeNote', { domain: 'DOMAIN' });
    expect(en).toBe('Please check the reading claim in DOMAIN — I can’t see an observation for it.');
    for (const lang of ['zh', 'ms'] as const) {
      const note = makeT(lang)('pages.report.defaultChangeNote', { domain: 'DOMAIN' });
      expect(note).not.toBe('pages.report.defaultChangeNote');
      expect(note).not.toBe(en);
      expect(note).toContain('DOMAIN');
    }
  });

  it('the update button has a generic label for when the new version is unknown', () => {
    expect(makeT('en')('shell.update.buttonGeneric')).toBe('Update now');
    expect(makeT('zh')('shell.update.buttonGeneric')).toBe('立即更新');
    expect(makeT('ms')('shell.update.buttonGeneric')).toBe('Kemas kini sekarang');
  });

  it('apply failures and unsupported browsers have their own copy', () => {
    expect(makeT('en')('shell.update.applyErrorText')).toBe('The update couldn’t be installed.');
    expect(makeT('en')('shell.settings.about.statusUnsupportedBrowser')).toBe('This browser doesn’t support automatic updates.');
    for (const lang of ['zh', 'ms'] as const) {
      expect(makeT(lang)('shell.update.applyErrorText')).not.toBe(makeT('en')('shell.update.applyErrorText'));
      expect(makeT(lang)('shell.settings.about.statusUnsupportedBrowser')).not.toBe(makeT('en')('shell.settings.about.statusUnsupportedBrowser'));
    }
  });
});
