import { describe, expect, it } from 'vitest';
import { TODAY, type Observation } from '../src/data/demo';
import { CURRENT_FRAMEWORK } from '../src/framework';
import { classCoverage, coverageFor, needsAttention, reviewQueue } from '../src/coverage';
import { initialState, reducer, type State } from '../src/store/reducer';
import { loadState, serializeState } from '../src/store/PortfolioContext';

const observation = (id: string, studentId: string, date: string, domain: Observation['domain'], term: 3 | 4 = 4): Observation => ({
  id, studentId, date, domain, term, milestone: 'developing', text: 'Observed learning evidence.', hasPhoto: false
});

function withObservations(observations: Observation[]): State {
  return { ...initialState(), observations };
}

describe('evidence coverage rules', () => {
  it('uses only the selected child and term, and reports missing when there is no evidence', () => {
    const state = withObservations([
      observation('one', 'ethan', TODAY, 'en'),
      observation('two', 'aria', TODAY, 'en', 3)
    ]);
    expect(coverageFor(state, 'aria', 4).find((area) => area.area === 'en')).toMatchObject({ count: 0, status: 'missing' });
  });

  it('uses the framework policy and treats exactly the minimum as sufficient', () => {
    expect(CURRENT_FRAMEWORK.coverage).toEqual({ minPerArea: 2, staleAfterDays: 21 });
    const state = withObservations([
      observation('one', 'aria', '2026-10-20', 'en'),
      observation('two', 'aria', '2026-10-21', 'en')
    ]);
    expect(coverageFor(state, 'aria', 4).find((area) => area.area === 'en')).toMatchObject({ count: 2, latestDate: '2026-10-21', status: 'ok' });
  });

  it('marks thin before stale, and marks exactly staleAfterDays as current', () => {
    const thinOld = withObservations([observation('one', 'aria', '2026-09-30', 'en')]);
    const exactAge = withObservations([
      observation('one', 'aria', '2026-10-01', 'zh'),
      observation('two', 'aria', '2026-10-01', 'zh')
    ]);
    const stale = withObservations([
      observation('one', 'aria', '2026-09-30', 'ma'),
      observation('two', 'aria', '2026-09-30', 'ma')
    ]);
    expect(coverageFor(thinOld, 'aria', 4).find((area) => area.area === 'en')?.status).toBe('thin');
    expect(coverageFor(exactAge, 'aria', 4).find((area) => area.area === 'zh')?.status).toBe('ok');
    expect(coverageFor(stale, 'aria', 4).find((area) => area.area === 'ma')?.status).toBe('stale');
  });

  it('returns all students, counts missing and stale areas, and sorts attention by gaps then oldest evidence', () => {
    const state = withObservations([
      observation('one', 'aria', TODAY, 'en'),
      observation('two', 'aria', TODAY, 'en'),
      observation('one', 'ethan', '2026-09-20', 'en'),
      observation('two', 'ethan', '2026-09-20', 'en')
    ]);
    const result = classCoverage(state, 4);
    expect(result.students).toHaveLength(20);
    expect(result.summary.childrenWithGaps).toBe(20);
    expect(result.summary.areasMissing).toBeGreaterThan(0);
    expect(result.summary.areasStale).toBeGreaterThan(0);
    const ordered = needsAttention(state, 4);
    expect(ordered.findIndex((student) => student.student.id === 'ethan'))
      .toBeLessThan(ordered.findIndex((student) => student.student.id === 'aria'));
  });
});

describe('review queue and stored schema', () => {
  it('sorts review reports oldest first and returns changes requested separately', () => {
    const queue = reviewQueue(initialState());
    expect(queue.inReview.map((item) => item.student.id)).toEqual(['ethan', 'daniel', 'priya', 'weiming']);
    expect(queue.inReview[0]).toMatchObject({ submittedAt: '2026-10-16', daysWaiting: 6 });
    expect(queue.inReview[0].unverifiedClaimCount).toBeGreaterThanOrEqual(0);
    expect(queue.changesRequested.map((item) => item.student.id)).toContain('rayan');
  });

  it('records and refreshes submittedAt when a report enters review', () => {
    let state = reducer(initialState(), { type: 'submitForReview', studentId: 'aria', submittedAt: '2026-10-19' });
    expect(state.reports.aria.submittedAt).toBe('2026-10-19');
    state = reducer(state, { type: 'requestChanges', studentId: 'aria', text: 'Please revise.', date: TODAY });
    state = reducer(state, { type: 'submitForReview', studentId: 'aria', submittedAt: TODAY });
    expect(state.reports.aria.submittedAt).toBe(TODAY);
  });

  it('bumps the serialized schema and resets old or incomplete review state', () => {
    const serialized = serializeState(initialState());
    expect(JSON.parse(serialized).schema).toBe(5);
    expect(loadState(serialized).reports.ethan.submittedAt).toBe('2026-10-16');
    const old = JSON.stringify({ schema: 4, state: initialState() });
    expect(loadState(old).reports.ethan.submittedAt).toBe('2026-10-16');
    const incomplete = initialState();
    delete incomplete.reports.ethan.submittedAt;
    expect(loadState(JSON.stringify({ schema: 5, state: incomplete })).reports.ethan.submittedAt).toBe('2026-10-16');
  });
});
