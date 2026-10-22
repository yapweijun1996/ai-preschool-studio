import { describe, expect, it } from 'vitest';
import { OBSERVATIONS, STUDENTS } from '../src/data/demo';
import { DOMAINS } from '../src/framework';
import { requestSuggestion } from '../src/services/mockProvider';
import { initialState, observationsFor, readiness, reducer } from '../src/store/reducer';
import { milestonesFor, studentSummary } from '../src/store/selectors';

describe('demo data is consistent for every student', () => {
  const s = initialState();

  it('has 20 fictional students and unique observation ids', () => {
    expect(STUDENTS).toHaveLength(20);
    const ids = OBSERVATIONS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of OBSERVATIONS) expect(STUDENTS.some((st) => st.id === o.studentId)).toBe(true);
  });

  it.each(STUDENTS.map((st) => st.id))('%s: counts, dates and milestones come from observations', (id) => {
    const sum = studentSummary(s, id)!;
    const t4 = observationsFor(s, id, 4);
    expect(sum.count).toBe(t4.length);
    const all = s.observations.filter((o) => o.studentId === id).map((o) => o.date).sort();
    expect(sum.lastObserved).toBe(all[all.length - 1]);
    const m4 = milestonesFor(s, id, 4);
    for (const d of DOMAINS) {
      const inDomain = t4.filter((o) => o.domain === d.key);
      // A milestone exists only when the domain has evidence.
      expect(m4[d.key] === null).toBe(inDomain.length === 0);
    }
  });

  it.each(STUDENTS.map((st) => st.id))('%s: report status matches its real content', (id) => {
    const status = s.reports[id].status;
    const r = readiness(s, id);
    if (status === 'notStarted') expect(r.sentences).toBe(0);
    if (status === 'review' || status === 'changes') expect(r.canSubmit).toBe(true);
    if (status === 'approved') expect(r.canApprove).toBe(true);
    // Every cited source belongs to this student.
    const own = new Set(s.observations.filter((o) => o.studentId === id).map((o) => o.id));
    for (const p of s.paragraphs[id] ?? []) for (const x of p.sentences) for (const src of x.sources) expect(own.has(src)).toBe(true);
  });
});

describe('report rules', () => {
  it('does not submit an incomplete draft', () => {
    const s0 = initialState();
    expect(readiness(s0, 'sofia').canSubmit).toBe(false);
    const s1 = reducer(s0, { type: 'submitForReview', studentId: 'sofia' });
    expect(s1.reports.sofia.status).toBe('draft');
  });

  it('starts a draft from observations only for a not-started report', () => {
    const s0 = initialState();
    const s1 = reducer(s0, { type: 'startDraft', studentId: 'kai' });
    expect(s1.reports.kai.status).toBe('draft');
    const kaiObs = new Set(observationsFor(s1, 'kai').map((o) => o.id));
    const paras = s1.paragraphs.kai;
    expect(paras.length).toBeGreaterThan(0);
    for (const p of paras) for (const x of p.sentences) expect(x.sources.every((src) => kaiObs.has(src))).toBe(true);
    // Not twice, and never over an existing draft.
    expect(reducer(s1, { type: 'startDraft', studentId: 'kai' })).toBe(s1);
    expect(reducer(s0, { type: 'startDraft', studentId: 'aria' })).toBe(s0);
  });

  it('adding an observation updates the domain milestone and count', () => {
    const s0 = initialState();
    expect(milestonesFor(s0, 'kai', 4).en).toBeNull();
    const s1 = reducer(s0, { type: 'addObservation', obs: { studentId: 'kai', date: '2026-10-22', domain: 'en', milestone: 'developing', text: 'Named three colours in English.', hasPhoto: false, term: 4 } });
    expect(milestonesFor(s1, 'kai', 4).en).toBe('developing');
    expect(studentSummary(s1, 'kai')!.count).toBe(studentSummary(s0, 'kai')!.count + 1);
    expect(studentSummary(s1, 'kai')!.lastObserved).toBe('2026-10-22');
  });

  it('mock suggestions for other students only cite their own observations', async () => {
    const s = initialState();
    for (const id of ['ethan', 'meiling', 'zoe']) {
      const own = new Set(s.observations.filter((o) => o.studentId === id).map((o) => o.id));
      for (const p of s.paragraphs[id]) {
        const sug = await requestSuggestion({ studentId: id, paragraph: p, action: 'clearer', variant: 0, available: true, delayMs: 0 });
        if (!sug) continue;
        for (const x of sug.after) {
          // The child's name keeps its capital letter after the lead-in.
          expect(x.text).toMatch(/^(This term|In class), [A-Z]/);
          expect(x.sources.length).toBeGreaterThan(0);
          for (const src of x.sources) expect(own.has(src)).toBe(true);
        }
      }
    }
  });
});
