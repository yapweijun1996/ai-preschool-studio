import { describe, expect, it } from 'vitest';
import { createDemoAdapter } from '../src/data/demoAdapter';
import { classCoverage, needsAttention, reviewQueue } from '../src/coverage';
import { formatApprovalAt } from '../src/i18n';
import { STUDENTS } from '../src/data/demo';
import { CURRENT_FRAMEWORK, frameworkFor, periodOf } from '../src/framework';
import { allSummaries, milestonesFor, studentSummary } from '../src/store/selectors';
import { approvalBlock, initialState, observationsFor, readiness, unverifiedClaims, type Action } from '../src/store/reducer';

function harness(seed = initialState()) {
  let state = seed;
  const adapter = createDemoAdapter(() => state, (action: Action) => {
    // Mirrors the provider's reducer dispatch while allowing each test to inspect the result.
    state = importReducer(state, action);
  });
  return { adapter, state: () => state };
}

import { reducer as importReducer } from '../src/store/reducer';

describe('DataPort demo adapter', () => {
  it('matches existing selectors and rules for every read method', async () => {
    const { adapter, state } = harness();
    const s = state();
    expect(await adapter.getStudentSummary('aria')).toEqual(studentSummary(s, 'aria'));
    expect(await adapter.getAllSummaries()).toEqual(allSummaries(s));
    expect(await adapter.getCurrentFramework()).toEqual(CURRENT_FRAMEWORK);
    expect(await adapter.getFramework('2026.1')).toEqual(frameworkFor('2026.1'));
    expect(await adapter.getPeriod('2026-10-22')).toEqual(periodOf('2026-10-22'));
    expect(await adapter.getMilestones('aria', 4)).toEqual(milestonesFor(s, 'aria', 4));
    expect(await adapter.getObservations('aria', 4)).toEqual(observationsFor(s, 'aria', 4));
    expect(await adapter.getReadiness('aria')).toEqual(readiness(s, 'aria'));
    expect(await adapter.getUnverifiedClaims('aria')).toEqual(unverifiedClaims(s, 'aria'));
    expect(await adapter.getDraft('aria')).toEqual({ paragraphs: s.paragraphs.aria, reflection: s.reflections.aria });
    expect(await adapter.getApprovalBlock('ethan')).toEqual(approvalBlock(s, 'ethan'));
    expect(await adapter.getCoverage(4)).toEqual(classCoverage(s, 4));
    expect(await adapter.getNeedsAttention(4)).toEqual(needsAttention(s, 4));
    expect(await adapter.getReviewQueue()).toEqual(reviewQueue(s));
  });

  it('adds an observation with the reducer assigned id and advances the counter', async () => {
    const h = harness();
    const before = h.state().nextObsNumber;
    const result = await h.adapter.addObservation({ studentId: 'aria', date: '2026-10-22', domain: 'en', text: 'A sufficiently detailed observation.', milestone: 'developing', hasPhoto: false });
    expect(result).toEqual({ ok: true, value: expect.objectContaining({ id: `OBS-${String(before).padStart(4, '0')}`, term: 4 }) });
    expect(h.state().nextObsNumber).toBe(before + 1);
  });

  it('refuses an out-of-period observation date', async () => {
    const result = await harness().adapter.addObservation({ studentId: 'aria', date: '2026-09-10', domain: 'en', text: 'A sufficiently detailed observation.', milestone: 'developing', hasPhoto: false });
    expect(result).toEqual({ ok: false, reason: 'date-outside-period' });
  });

  it('refuses linking another child’s observation', async () => {
    const result = await harness().adapter.linkSource('aria', 's-en-1', 'OBS-0155');
    expect(result).toEqual({ ok: false, reason: 'wrong-child-observation' });
  });

  it('refuses content edits on an approved report', async () => {
    expect(await harness().adapter.setReflection('meiling', 'new text')).toEqual({ ok: false, reason: 'report-locked' });
  });

  it('returns a typed refusal for every remaining closed-union reason', async () => {
    const h = harness();
    expect(await h.adapter.addObservation({ studentId: 'missing', date: '2026-10-22', domain: 'en', text: 'A sufficiently detailed observation.', milestone: 'developing', hasPhoto: false })).toEqual({ ok: false, reason: 'unknown-student' });
    expect(await h.adapter.removeSentence('ethan', 's-ethan-en-1')).toEqual({ ok: false, reason: 'report-not-editable' });
    expect(await h.adapter.startDraft('aria')).toEqual({ ok: false, reason: 'invalid-target' });
    expect(await h.adapter.requestChanges('aria', 'Please revise.', '2026-10-22')).toEqual({ ok: false, reason: 'report-not-editable' });
    const empty = initialState();
    empty.observations = empty.observations.filter((observation) => observation.studentId !== 'arjun');
    expect(await harness(empty).adapter.startDraft('arjun')).toEqual({ ok: false, reason: 'no-observations' });
  });

  it('refuses submission before readiness', async () => {
    expect(await harness().adapter.submitForReview('arjun')).toEqual({ ok: false, reason: 'not-ready' });
  });

  it('refuses approval with unverified claims', async () => {
    const seed = initialState();
    seed.reports.aria.status = 'review';
    expect(await harness(seed).adapter.approve('aria', 'Reviewer', '2026-10-22T09:00:00.000Z')).toEqual({ ok: false, reason: 'unverified-claims' });
  });

  it('approves ready reports with ISO time and approvedBy in the port result', async () => {
    const seed = initialState();
    seed.paragraphs.hana = [...seed.paragraphs.hana];
    const h = harness(seed);
    const result = await h.adapter.approve('ethan', 'Reviewer One', '2026-10-22T09:00:00.000Z');
    expect(result).toEqual({ ok: true, value: { approvedBy: 'Reviewer One', at: '2026-10-22T09:00:00.000Z' } });
    expect(h.state().reports.ethan.approvedAt).toBe(formatApprovalAt('2026-10-22T09:00:00.000Z'));
  });

  it('supports each remaining port write against reducer actions', async () => {
    const draftState = initialState();
    draftState.reports.arjun.status = 'notStarted';
    const started = harness(draftState);
    expect((await started.adapter.startDraft('arjun')).ok).toBe(true);

    const editable = harness();
    await editable.adapter.fillMissingDomains('aria');
    expect((await editable.adapter.removeSentence('aria', 's-en-2')).ok).toBe(true);
    expect((await editable.adapter.restoreParagraph('aria', editable.state().paragraphs.aria[0])).ok).toBe(true);
    expect((await editable.adapter.setReflection('aria', 'Reflection text')).ok).toBe(true);
    const source = editable.state().observations.find((obs) => obs.studentId === 'aria')!;
    expect((await editable.adapter.linkSource('aria', 's-en-2', source.id)).ok).toBe(true);
    expect((await editable.adapter.applySuggestion('aria', { id: 'test', paragraphId: 'p-en', action: 'clearer', variant: 0, before: [], after: [{ id: 's-new', text: 'Aria reads with evidence.', sources: ['OBS-0149'] }] })).ok).toBe(true);
    expect((await editable.adapter.requestChanges('ethan', 'Please revise.', '2026-10-22')).ok).toBe(true);
    expect((await editable.adapter.submitForReview('ethan')).ok).toBe(true);
    expect(STUDENTS.length).toBeGreaterThan(0);
  });
});
