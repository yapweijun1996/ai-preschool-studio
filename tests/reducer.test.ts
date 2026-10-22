import { describe, expect, it } from 'vitest';
import { approvalBlock, initialState, reducer, unverifiedClaims } from '../src/store/reducer';
import { requestSuggestion } from '../src/services/mockProvider';

describe('portfolio reducer', () => {
  it('flags sentences without sources as needing teacher verification', () => {
    const s = initialState();
    expect(unverifiedClaims(s, 'aria').map((c) => c.sentence.id)).toEqual(['s-en-2', 's-se-1']);
  });

  it('blocks approval with a reason until every claim has evidence', () => {
    let s = reducer(initialState(), { type: 'submitForReview', studentId: 'aria' });
    expect(s.reports.aria.status).toBe('review');
    expect(approvalBlock(s, 'aria')).toEqual({ reason: 'claims', count: 2 });

    s = reducer(s, { type: 'approve', studentId: 'aria', at: 'now' });
    expect(s.reports.aria.status).toBe('review');

    s = reducer(s, { type: 'linkSource', studentId: 'aria', sentenceId: 's-en-2', obsId: 'OBS-0149' });
    s = reducer(s, { type: 'removeSentence', studentId: 'aria', sentenceId: 's-se-1' });
    expect(approvalBlock(s, 'aria')).toBeNull();

    s = reducer(s, { type: 'approve', studentId: 'aria', at: 'now' });
    expect(s.reports.aria.status).toBe('approved');
  });

  it('only approves reports that are in review', () => {
    const s = initialState();
    expect(approvalBlock(s, 'aria')).toEqual({ reason: 'status', status: 'draft' });
  });

  it('moves review → changes requested → review', () => {
    let s = reducer(initialState(), { type: 'submitForReview', studentId: 'aria' });
    s = reducer(s, { type: 'requestChanges', studentId: 'aria', text: 'Check reading claim', date: '2026-10-22' });
    expect(s.reports.aria).toMatchObject({ status: 'changes', hadChanges: true, comment: { text: 'Check reading claim' } });
    s = reducer(s, { type: 'submitForReview', studentId: 'aria' });
    expect(s.reports.aria.status).toBe('review');
  });

  it('applies a suggestion and restores the previous paragraph on undo', async () => {
    const s0 = initialState();
    const before = s0.paragraphs.aria.find((p) => p.id === 'p-se')!;
    const suggestion = await requestSuggestion({ paragraph: before, action: 'clearer', variant: 0, available: true, delayMs: 0 });
    expect(suggestion).not.toBeNull();
    const s1 = reducer(s0, { type: 'applySuggestion', studentId: 'aria', suggestion: suggestion! });
    expect(unverifiedClaims(s1, 'aria')).toHaveLength(1);
    const s2 = reducer(s1, { type: 'restoreParagraph', studentId: 'aria', paragraph: before });
    expect(s2.paragraphs.aria.find((p) => p.id === 'p-se')).toEqual(before);
  });

  it('assigns sequential observation IDs', () => {
    const s = reducer(initialState(), {
      type: 'addObservation',
      obs: { studentId: 'aria', date: '2026-10-22', domain: 'ma', milestone: 'developing', text: 'Sorted shells by size.', hasPhoto: false, term: 4 }
    });
    expect(s.observations[0].id).toBe('OBS-0158');
    expect(s.nextObsNumber).toBe(159);
  });
});

describe('mock provider', () => {
  it('cites a source for every suggested sentence', async () => {
    for (const p of initialState().paragraphs.aria) {
      for (const action of ['clearer', 'shorten'] as const) {
        const s = await requestSuggestion({ paragraph: p, action, variant: 0, available: true, delayMs: 0 });
        expect(s!.after.every((x) => x.sources.length > 0)).toBe(true);
      }
    }
  });

  it('rejects when the provider is unavailable', async () => {
    const p = initialState().paragraphs.aria[0];
    await expect(requestSuggestion({ paragraph: p, action: 'clearer', variant: 0, available: false, delayMs: 0 })).rejects.toThrow('Mock provider');
  });
});
