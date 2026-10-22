import { describe, expect, it } from 'vitest';
import { approvalBlock, initialState, reducer, reportContentHash, selectAuditLog, selectReportHistory, unverifiedClaims } from '../src/store/reducer';
import { requestSuggestion } from '../src/services/mockProvider';
import { NEXT_OBS_NUMBER } from '../src/data/demo';
import { now } from '../src/utils/clock';

describe('portfolio reducer', () => {
  it('uses the injectable clock as an ISO instant', () => {
    expect(now(() => new Date('2026-10-22T08:32:00.000Z'))).toBe('2026-10-22T08:32:00.000Z');
  });
  it('stores audit summaries as translation keys and keeps reviewer free text only in decision details', () => {
    const seeded = initialState();
    expect(seeded.auditEvents.every((event) => !('summary' in event))).toBe(true);
    let s = reducer(seeded, { type: 'requestChanges', studentId: 'ethan', text: 'private narrative note', date: '2026-10-22T08:32:00.000Z' });
    const event = s.auditEvents.at(-1)!;
    expect(event).toMatchObject({ summaryKey: 'pages.audit.summaryChangesRequested', decision: { comment: 'private narrative note' } });
    expect(event.summaryKey).not.toContain('private narrative note');
    expect('summary' in event).toBe(false);
  });
  it('clears frozen report labels when reopening while retaining frozen versions', () => {
    const frozen = initialState().reports.meiling.versions[0];
    const reopened = reducer(initialState(), { type: 'reopen', studentId: 'meiling', reason: 'Update', reopenedBy: 'Ms. Tan', at: '2026-10-22T10:00:00.000Z' }).reports.meiling;
    expect(reopened).toMatchObject({ status: 'draft', versions: [frozen] });
    expect(reopened.approvedAt).toBeUndefined();
    expect(reopened.approvedBy).toBeUndefined();
    expect(reopened.frameworkVersion).toBeUndefined();
    expect(reopened.milestones).toBeUndefined();
  });
  it('derives report history from audit events and reset starts a new matching history segment', () => {
    let s = initialState();
    expect('decisions' in s.reports.meiling).toBe(false);
    s = reducer(s, { type: 'reopen', studentId: 'meiling', reason: 'Amend', reopenedBy: 'Ms. Tan', at: '2026-10-22T10:00:00.000Z' });
    s = reducer(s, { type: 'submitForReview', studentId: 'meiling', submittedAt: '2026-10-22T10:30:00.000Z' });
    s = reducer(s, { type: 'approve', studentId: 'meiling', at: '2026-10-22T11:00:00.000Z' });
    expect(selectReportHistory(s.auditEvents, 'meiling').some((decision) => decision.type === 'approved' && decision.version === 2)).toBe(true);
    s = reducer(s, { type: 'reset', at: '2026-10-22T12:00:00.000Z' });
    expect(s.reports.meiling.versions.map((version) => version.version)).toEqual([1]);
    expect(selectReportHistory(s.auditEvents, 'meiling').map((decision) => decision.type)).toEqual(['approved', 'released']);
    expect(s.auditEvents.map((event) => event.action).lastIndexOf('demo.reset')).toBeGreaterThan(0);
  });
  it('filters audit instants using the viewer local calendar date', () => {
    const seeded = initialState().auditEvents[0];
    const events = ['2026-10-22T01:30:00.000Z', '2026-10-21T18:30:00.000Z'].map((at, index) => ({ ...seeded, id: `TZ-${index}`, at }));
    const day = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const localDay = day(new Date(events[0].at));
    expect(events.every((event) => day(new Date(event.at)) === localDay)).toBe(true);
    expect(selectAuditLog(events, { from: localDay, to: localDay })).toHaveLength(2);
  });
  it('stores audit and decision timestamps as full instants and sorts same-time events by sequence', () => {
    const seeded = initialState();
    expect(seeded.auditEvents.every((event) => /^\d{4}-\d\d-\d\dT/.test(event.at))).toBe(true);
    let s = reducer(seeded, { type: 'requestChanges', studentId: 'ethan', text: 'check', date: '2026-10-22T08:32:00.000Z' });
    s = reducer(s, { type: 'addObservation', at: '2026-10-22T08:32:00.000Z', obs: { studentId: 'aria', date: '2026-10-22', domain: 'ma', milestone: 'developing', text: 'Counted blocks.', hasPhoto: false, term: 4 } });
    expect(s.auditEvents.slice(-2).map((event) => event.action)).toEqual(['report.changesRequested', 'observation.added']);
    expect(selectAuditLog(s.auditEvents).slice(0, 2).map((event) => event.action)).toEqual(['observation.added', 'report.changesRequested']);
  });
  it('flags sentences without sources as needing teacher verification', () => {
    const s = initialState();
    expect(unverifiedClaims(s, 'aria').map((c) => c.sentence.id)).toEqual(['s-en-2', 's-se-1']);
  });

  it('blocks approval with a reason until every claim has evidence', () => {
    let s = reducer(initialState(), { type: 'submitForReview', studentId: 'aria', submittedAt: '2026-10-22' });
    expect(s.reports.aria.status).toBe('review');
    expect(approvalBlock(s, 'aria')).toEqual({ reason: 'claims', count: 2 });

    s = reducer(s, { type: 'approve', studentId: 'aria', at: '2026-10-22T09:00:00.000Z' });
    expect(s.reports.aria.status).toBe('review');

    s = reducer(s, { type: 'linkSource', studentId: 'aria', sentenceId: 's-en-2', obsId: 'OBS-0149' });
    s = reducer(s, { type: 'linkSource', studentId: 'aria', sentenceId: 's-se-1', obsId: 'OBS-0151' });
    expect(approvalBlock(s, 'aria')).toBeNull();

    s = reducer(s, { type: 'approve', studentId: 'aria', at: '2026-10-22T09:00:00.000Z' });
    expect(s.reports.aria.status).toBe('approved');
  });

  it('only approves reports that are in review', () => {
    const s = initialState();
    expect(approvalBlock(s, 'aria')).toEqual({ reason: 'status', status: 'draft' });
  });

  it('moves review → changes requested → review', () => {
    let s = reducer(initialState(), { type: 'submitForReview', studentId: 'aria', submittedAt: '2026-10-22' });
    s = reducer(s, { type: 'requestChanges', studentId: 'aria', text: 'Check reading claim', date: '2026-10-22' });
    expect(s.reports.aria).toMatchObject({ status: 'changes', hadChanges: true, comment: { text: 'Check reading claim' } });
    s = reducer(s, { type: 'submitForReview', studentId: 'aria', submittedAt: '2026-10-22' });
    expect(s.reports.aria.status).toBe('review');
  });

  it('applies a suggestion and restores the previous paragraph on undo', async () => {
    const s0 = initialState();
    const before = s0.paragraphs.aria.find((p) => p.id === 'p-se')!;
    const suggestion = await requestSuggestion({ studentId: 'aria', paragraph: before, action: 'clearer', variant: 0, available: true, delayMs: 0 });
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
    expect(s.observations[0].id).toBe(`OBS-${String(NEXT_OBS_NUMBER).padStart(4, '0')}`);
    expect(s.nextObsNumber).toBe(NEXT_OBS_NUMBER + 1);
  });

  it('freezes an immutable version with deterministic content hash on approval', () => {
    let s = reducer(initialState(), { type: 'submitForReview', studentId: 'aria', submittedAt: '2026-10-22' });
    s = reducer(s, { type: 'linkSource', studentId: 'aria', sentenceId: 's-en-2', obsId: 'OBS-0149' });
    s = reducer(s, { type: 'linkSource', studentId: 'aria', sentenceId: 's-se-1', obsId: 'OBS-0151' });
    const frozen = JSON.stringify({ paragraphs: s.paragraphs.aria, reflection: s.reflections.aria });
    s = reducer(s, { type: 'approve', studentId: 'aria', at: '2026-10-22T09:00:00.000Z', approvedBy: 'Ms. Tan' });
    expect(s.reports.aria.versions[0]).toMatchObject({ version: 1, approvedAt: '2026-10-22T09:00:00.000Z', approvedBy: 'Ms. Tan', contentHash: reportContentHash(s.paragraphs.aria, s.reflections.aria, s.reports.aria.versions[0].frameworkVersion, s.reports.aria.versions[0].milestones) });
    expect(JSON.stringify({ paragraphs: s.reports.aria.versions[0].paragraphs, reflection: s.reports.aria.versions[0].reflection })).toBe(frozen);
    const version = s.reports.aria.versions[0];
    s = reducer(s, { type: 'reopen', studentId: 'aria', reason: 'Correction', reopenedBy: 'Ms. Tan', at: '2026-10-22T10:00:00.000Z' });
    s = reducer(s, { type: 'setReflection', studentId: 'aria', text: 'Changed draft' });
    expect(s.reports.aria.versions[0]).toEqual(version);
  });

  it('refuses release before approval, releases idempotently, and preserves release on reopen', () => {
    let s = initialState();
    expect(reducer(s, { type: 'release', studentId: 'aria', at: '2026-10-22T10:00:00.000Z', releasedBy: 'Ms. Tan' })).toBe(s);
    s = reducer(s, { type: 'release', studentId: 'meiling', at: '2026-10-22T10:00:00.000Z', releasedBy: 'Ms. Tan' });
    expect(s.reports.meiling.releasedVersion).toBe(1);
    const released = s;
    expect(reducer(s, { type: 'release', studentId: 'meiling', at: '2026-10-22T10:00:00.000Z', releasedBy: 'Ms. Tan' })).toBe(s);
    s = reducer(s, { type: 'reopen', studentId: 'meiling', reason: 'Update note', reopenedBy: 'Ms. Tan', at: '2026-10-22T11:00:00.000Z' });
    expect(s.reports.meiling.releasedVersion).toBe(released.reports.meiling.releasedVersion);
    expect(s.reports.meiling.versions[0]).toEqual(released.reports.meiling.versions[0]);
  });

  it('keeps audit events append-only across reset and filters newest-first', () => {
    let s = reducer(initialState(), { type: 'submitForReview', studentId: 'aria', submittedAt: '2026-10-22', actor: { role: 'teacher', name: 'Ms. Lim' } });
    const before = s.auditEvents;
    s = reducer(s, { type: 'reset' });
    expect(s.auditEvents.slice(0, before.length)).toEqual(before);
    expect(s.auditEvents.some((event) => event.action === 'demo.reset')).toBe(true);
    const filtered = selectAuditLog(s.auditEvents, { studentId: 'aria' });
    expect(filtered[0].at >= filtered.at(-1)!.at).toBe(true);
  });
});

describe('mock provider', () => {
  it('cites a source for every suggested sentence', async () => {
    for (const p of initialState().paragraphs.aria) {
      for (const action of ['clearer', 'shorten'] as const) {
        const s = await requestSuggestion({ studentId: 'aria', paragraph: p, action, variant: 0, available: true, delayMs: 0 });
        expect(s!.after.every((x) => x.sources.length > 0)).toBe(true);
      }
    }
  });

  it('rejects when the provider is unavailable', async () => {
    const p = initialState().paragraphs.aria[0];
    await expect(requestSuggestion({ studentId: 'aria', paragraph: p, action: 'clearer', variant: 0, available: false, delayMs: 0 })).rejects.toThrow('Mock provider');
  });
});
