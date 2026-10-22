import { describe, expect, it } from 'vitest';
import { CURRENT_FRAMEWORK, DOMAINS, FRAMEWORKS, MILESTONES, NEL_AREAS, frameworkFor, termOf } from '../src/framework';
import { OBSERVATIONS } from '../src/data/demo';
import { initialState, reducer } from '../src/store/reducer';

const LANGS = ['en', 'zh', 'ms'] as const;

describe('learning framework (single owner of areas, scale and periods)', () => {
  it('is versioned and current', () => {
    expect(FRAMEWORKS[CURRENT_FRAMEWORK.version]).toBe(CURRENT_FRAMEWORK);
    expect(frameworkFor(undefined)).toBe(CURRENT_FRAMEWORK);
    expect(frameworkFor('no-such-version')).toBe(CURRENT_FRAMEWORK);
  });

  it('labels every area, level and period in all three languages; areas stay bilingual with 中文', () => {
    for (const a of CURRENT_FRAMEWORK.areas) {
      for (const l of LANGS) {
        expect(a.full[l].trim()).not.toBe('');
        expect(a.short[l].trim()).not.toBe('');
        expect(a.full[l]).toMatch(/[一-鿿]/);
        expect(a.full[l]).toMatch(/[A-Za-z]/);
      }
    }
    for (const m of CURRENT_FRAMEWORK.scale) for (const l of LANGS) expect(m.label[l].trim()).not.toBe('');
    for (const p of CURRENT_FRAMEWORK.periods) for (const l of LANGS) expect(p.label[l].trim()).not.toBe('');
  });

  it('maps every area to a NEL learning area or core competency', () => {
    const nel = new Set(NEL_AREAS.map((n) => n.key));
    for (const a of CURRENT_FRAMEWORK.areas) expect(nel.has(a.nel)).toBe(true);
  });

  it('is the source of DOMAINS and MILESTONES, with stable keys', () => {
    expect(DOMAINS.map((d) => d.key)).toEqual(['en', 'zh', 'ma', 'se']);
    expect(MILESTONES.map((m) => m.key)).toEqual(['emerging', 'developing', 'consistent']);
  });

  it('reporting periods do not overlap and agree with every observation’s term', () => {
    const [t3, t4] = [...CURRENT_FRAMEWORK.periods].sort((a, b) => a.start.localeCompare(b.start));
    expect(t3.end < t4.start).toBe(true);
    for (const o of OBSERVATIONS) expect(termOf(o.date)).toBe(o.term);
  });

  it('an approved report records the framework version it was approved under', () => {
    let s = initialState();
    s = reducer(s, { type: 'submitForReview', studentId: 'aria', submittedAt: '2026-10-22' });
    s = reducer(s, { type: 'linkSource', studentId: 'aria', sentenceId: 's-en-2', obsId: 'OBS-0149' });
    s = reducer(s, { type: 'linkSource', studentId: 'aria', sentenceId: 's-se-1', obsId: 'OBS-0151' });
    s = reducer(s, { type: 'approve', studentId: 'aria', at: '2026-10-22T09:00:00.000Z' });
    expect(s.reports.aria.status).toBe('approved');
    expect(s.reports.aria.frameworkVersion).toBe(CURRENT_FRAMEWORK.version);
    // Seeded approved reports carry one too.
    for (const [id, r] of Object.entries(initialState().reports)) if (r.status === 'approved') expect(r.frameworkVersion, id).toBe(CURRENT_FRAMEWORK.version);
  });
});

describe('period names have one owner', () => {
  it('no UI string hard-codes a term name (the framework supplies it)', async () => {
    const locales = await Promise.all(['en', 'zh', 'ms'].map((l) => import(`../src/i18n/locales/${l}/index.ts`)));
    const flat = (o: unknown): string[] => (typeof o === 'string' ? [o] : Object.values(o as object).flatMap(flat));
    for (const mod of locales) {
      const strings = flat(Object.values(mod)[0]);
      const hard = strings.filter((s) => /Term [34]|第 ?[34] ?学期|Penggal [34]/.test(s));
      expect(hard).toEqual([]);
    }
  });
});
