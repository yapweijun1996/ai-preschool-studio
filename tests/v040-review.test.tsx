import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MilestoneDots } from '../src/components/ui';
import { CURRENT_FRAMEWORK, FRAMEWORKS, termOf, type Framework } from '../src/framework';
import { I18nProvider } from '../src/i18n';
import { STUDENTS } from '../src/data/demo';
import { loadState, serializeState } from '../src/store/PortfolioContext';
import { initialState, reducer } from '../src/store/reducer';
import { milestonesFor } from '../src/store/selectors';

describe('v0.4.0 review fixes', () => {
  it('discards stored state from an older data shape instead of crashing', () => {
    const legacy = JSON.stringify({ observations: [], paragraphs: {}, reflections: {}, reports: { aria: { status: 'draft', hadChanges: false } }, sim: { aiDown: false, saveFail: false }, nextObsNumber: 158 });
    const s = loadState(legacy);
    for (const st of STUDENTS) expect(s.reports[st.id], st.id).toBeDefined();
    // Current state round-trips.
    const current = reducer(initialState(), { type: 'setSim', key: 'aiDown', value: true });
    expect(loadState(serializeState(current)).sim.aiDown).toBe(true);
    // A current-shaped state saved without the schema tag is also discarded.
    expect(loadState(JSON.stringify(current)).sim.aiDown).toBe(false);
    expect(loadState(null).reports.aria.status).toBe('draft');
    // Right schema but missing fields: start fresh rather than crash later.
    const { paragraphs: _p, ...partial } = current;
    void _p;
    expect(loadState(JSON.stringify({ schema: 4, state: partial })).paragraphs.aria).toBeDefined();
    expect(loadState('{not json').reports.aria.status).toBe('draft');
  });

  it('termOf honours period ends and the gap between terms', () => {
    expect(termOf('2026-09-10')).toBeUndefined();
    expect(termOf('2026-11-21')).toBeUndefined();
    expect(termOf('2026-09-14')).toBe(4);
    expect(termOf('2026-09-06')).toBe(3);
    const s0 = initialState();
    const s1 = reducer(s0, { type: 'addObservation', obs: { studentId: 'kai', date: '2026-09-10', domain: 'en', milestone: 'emerging', text: 'Between terms.', hasPhoto: false, term: 4 } });
    expect(s1).toBe(s0);
  });

  it('MilestoneDots renders the labels and dots of the given framework version', () => {
    const old: Framework = { ...CURRENT_FRAMEWORK, version: 'test.0', scale: CURRENT_FRAMEWORK.scale.map((m) => ({ ...m, label: { en: `Old ${m.label.en}`, zh: m.label.zh, ms: m.label.ms } })) };
    FRAMEWORKS[old.version] = old;
    try {
      render(<I18nProvider initial="en"><MilestoneDots milestone="emerging" version="test.0" /></I18nProvider>);
      expect(screen.getByText('Old Emerging')).toBeTruthy();
    } finally {
      delete FRAMEWORKS[old.version];
    }
  });

  it('an approved report keeps the milestones it was approved with', () => {
    const s0 = initialState();
    const approved = STUDENTS.find((x) => s0.reports[x.id].status === 'approved')!.id;
    const frozen = s0.reports[approved].milestones!;
    expect(frozen).toEqual(milestonesFor(s0, approved, 4));
    const s1 = reducer(s0, { type: 'addObservation', obs: { studentId: approved, date: '2026-10-22', domain: 'ma', milestone: 'emerging', text: 'Counted to five with help.', hasPhoto: false, term: 4 } });
    expect(milestonesFor(s1, approved, 4).ma).toBe('emerging');
    expect(s1.reports[approved].milestones).toEqual(frozen);
  });
});
