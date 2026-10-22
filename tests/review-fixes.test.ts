import { describe, expect, it } from 'vitest';
import { OBSERVATIONS, STUDENTS, draftFromObservations } from '../src/data/demo';
import { requestSuggestion } from '../src/services/mockProvider';
import { initialState, observationsFor, readiness, reducer } from '../src/store/reducer';

const ethanObs = OBSERVATIONS.find((o) => o.studentId === 'ethan')!.id;

describe('v0.3.6 review fixes', () => {
  it('refuses to link another child’s observation', () => {
    const s0 = initialState();
    const s1 = reducer(s0, { type: 'linkSource', studentId: 'aria', sentenceId: 's-en-2', obsId: ethanObs });
    expect(s1).toBe(s0);
  });

  it('refuses a suggestion that cites another child’s observation', async () => {
    const s0 = initialState();
    const ariaSe = s0.paragraphs.aria.find((p) => p.id === 'p-se')!;
    const sug = (await requestSuggestion({ studentId: 'aria', paragraph: ariaSe, action: 'clearer', variant: 0, available: true, delayMs: 0 }))!;
    // Aria's suggestion applied to Ethan (stale Studio state) must not land.
    const s1 = reducer(s0, { type: 'applySuggestion', studentId: 'ethan', suggestion: sug });
    expect(s1).toBe(s0);
  });

  it('every incomplete draft can be completed: missing domains fill from the child’s own observations', () => {
    let s = initialState();
    expect(readiness(s, 'sofia').domainsWritten).toBe(3);
    s = reducer(s, { type: 'addObservation', obs: { studentId: 'sofia', date: '2026-10-22', domain: 'se', milestone: 'developing', text: 'Helped a friend find a lost shoe.', hasPhoto: false, term: 4 } });
    s = reducer(s, { type: 'fillMissingDomains', studentId: 'sofia' });
    expect(readiness(s, 'sofia').domainsWritten).toBe(4);
    s = reducer(s, { type: 'setReflection', studentId: 'sofia', text: 'Sofia has grown in confidence.' });
    expect(readiness(s, 'sofia').canSubmit).toBe(true);
    const own = new Set(observationsFor(s, 'sofia').map((o) => o.id));
    for (const p of s.paragraphs.sofia) for (const x of p.sentences) for (const src of x.sources) expect(own.has(src)).toBe(true);
  });

  it('removing Aria’s last Social-Emotional claim is recoverable', () => {
    let s = reducer(initialState(), { type: 'removeSentence', studentId: 'aria', sentenceId: 's-se-1' });
    expect(readiness(s, 'aria').domainsWritten).toBe(3);
    s = reducer(s, { type: 'fillMissingDomains', studentId: 'aria' });
    expect(readiness(s, 'aria').domainsWritten).toBe(4);
  });

  it('locks content once a report is approved', () => {
    let s = initialState();
    const approved = STUDENTS.find((x) => s.reports[x.id].status === 'approved')!.id;
    const p = s.paragraphs[approved][0];
    const s1 = reducer(s, { type: 'removeSentence', studentId: approved, sentenceId: p.sentences[0].id });
    expect(s1).toBe(s);
    s = reducer(s, { type: 'setReflection', studentId: approved, text: '' });
    expect(readiness(s, approved).hasReflection).toBe(true);
  });

  it('derives the term from the observation date', () => {
    const s = reducer(initialState(), { type: 'addObservation', obs: { studentId: 'kai', date: '2026-08-10', domain: 'en', milestone: 'emerging', text: 'Named two colours.', hasPhoto: false, term: 4 } });
    expect(s.observations[0].term).toBe(3);
  });

  it('mock rewrites never stack their lead-in', async () => {
    let s = initialState();
    for (let round = 0; round < 3; round++) {
      const p = s.paragraphs.ethan.find((x) => x.id === 'p-se')!;
      const sug = (await requestSuggestion({ studentId: 'ethan', paragraph: p, action: 'clearer', variant: round, available: true, delayMs: 0 }))!;
      for (const x of sug.after) expect(x.text).not.toMatch(/^(This term|In class), (This term|In class),/);
      s = reducer(s, { type: 'applySuggestion', studentId: 'ethan', suggestion: sug });
    }
  });

  it('generated observations do not repeat text within a child', () => {
    for (const st of STUDENTS) {
      const texts = OBSERVATIONS.filter((o) => o.studentId === st.id && o.term === 4).map((o) => o.text);
      expect(new Set(texts).size, st.id).toBe(texts.length);
    }
  });

  it('a note that already starts with the child’s name is not doubled', () => {
    const kai = STUDENTS.find((x) => x.id === 'kai')!;
    const paras = draftFromObservations(kai, [{ id: 'OBS-9999', studentId: 'kai', date: '2026-10-22', domain: 'ma', milestone: 'developing', text: 'Kai counted ten shells.', hasPhoto: false, term: 4 }]);
    expect(paras[0].sentences[0].text).toBe('Kai counted ten shells.');
  });
});
