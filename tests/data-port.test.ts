import { describe, expect, it } from 'vitest';
import { createDemoAdapter } from '../src/data/demoAdapter';
import { classCoverage, needsAttention, reviewQueue } from '../src/coverage';
import { STUDENTS } from '../src/data/demo';
import { CURRENT_FRAMEWORK, frameworkFor, periodOf } from '../src/framework';
import { allSummaries, milestonesFor, studentSummary } from '../src/store/selectors';
import { approvalBlock, initialState, observationsFor, readiness, unverifiedClaims, type Action, type Actor } from '../src/store/reducer';

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
  it('reads classes, child, guardians and authorised collectors', async () => {
    const { adapter } = harness();
    expect(await adapter.getClasses()).toMatchObject([{ name: 'K2 Sunflower', level: 'K2', year: 2026 }]);
    expect(await adapter.getChild('aria')).toMatchObject({ id: 'aria', classId: 'k2-sunflower-2026', status: 'active' });
    expect(await adapter.getGuardians('aria')).toHaveLength(1);
    expect(await adapter.getCollectors('aria')).toHaveLength(1);
    expect(await adapter.getChild('missing')).toBeUndefined();
  });

  it('validates and audits child, guardian and collector writes', async () => {
    const h = harness();
    const actor: Actor = { role: 'admin', name: 'Mr. Wong' };
    const child = (await h.adapter.getChild('aria'))!;
    expect(await h.adapter.updateChild({ ...child, enrolledOn: '2025-01-01' }, actor)).toMatchObject({ ok: true });
    const guardian = (await h.adapter.getGuardians('aria'))![0];
    expect(await h.adapter.upsertGuardian({ ...guardian, id: 'guardian-new', isPrimary: false, phone: '555' }, actor)).toEqual({ ok: false, reason: 'invalid-guardian' });
    expect(await h.adapter.upsertGuardian({ ...guardian, id: 'guardian-new', isPrimary: false }, actor)).toMatchObject({ ok: true });
    expect(await h.adapter.removeGuardian(guardian.id, actor)).toEqual({ ok: false, reason: 'primary-guardian-required' });
    const collector = (await h.adapter.getCollectors('aria'))![0];
    expect(await h.adapter.upsertCollector({ ...collector, validFrom: '2026-10-23', validTo: '2026-10-22' }, actor)).toEqual({ ok: false, reason: 'invalid-collector' });
    expect(await h.adapter.upsertCollector({ ...collector, note: 'Updated fictional note' }, actor)).toMatchObject({ ok: true });
    expect(await h.adapter.removeCollector(collector.id, actor)).toMatchObject({ ok: true });
    expect(h.state().auditEvents.slice(-3).map((event) => event.actor.role)).toEqual(['admin', 'admin', 'admin']);
    expect(JSON.stringify(h.state().auditEvents.slice(-3))).not.toContain('Updated fictional note');
  });

  it('returns typed child and report-in-review withdrawal refusals', async () => {
    const { adapter, state } = harness();
    expect(await adapter.withdrawChild('missing')).toEqual({ ok: false, reason: 'unknown-child' });
    expect(await adapter.withdrawChild('ethan')).toEqual({ ok: false, reason: 'report-in-review' });
    expect(state().children.ethan.status).toBe('active');
    expect(await adapter.withdrawChild('aria')).toMatchObject({ ok: true, value: { status: 'withdrawn' } });
  });

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
    expect(await adapter.getReleasedVersion('meiling')).toEqual(s.reports.meiling.versions[0]);
    expect(await adapter.getReleasedVersion('hana')).toBeUndefined();
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
    expect(h.state().reports.ethan.approvedAt).toBe('2026-10-22T09:00:00.000Z');
    expect(h.state().reports.ethan.approvedBy).toBe('Reviewer One');
    expect(h.state().reports.ethan.versions[0].approvedBy).toBe('Reviewer One');
    expect(await h.adapter.getReportHistory('ethan')).toContainEqual(expect.objectContaining({ type: 'approved', by: 'Reviewer One' }));
  });

  it('releases only an approved latest version and makes repeated release idempotent', async () => {
    const h = harness();
    expect(await h.adapter.releaseReport('aria', 'Reviewer', '2026-10-22T10:00:00.000Z')).toEqual({ ok: false, reason: 'not-approved' });
    expect(await h.adapter.releaseReport('missing', 'Reviewer', '2026-10-22T10:00:00.000Z')).toEqual({ ok: false, reason: 'unknown-student' });
    const result = await h.adapter.releaseReport('meiling', 'Reviewer', '2026-10-22T10:00:00.000Z');
    expect(result).toEqual({ ok: true, value: undefined });
    const events = h.state().auditEvents.length;
    expect(await h.adapter.releaseReport('meiling', 'Reviewer', '2026-10-22T10:00:00.000Z')).toEqual({ ok: true, value: undefined });
    expect(h.state().auditEvents).toHaveLength(events);
    expect((await h.adapter.getReportHistory('meiling')).at(-1)).toMatchObject({ type: 'released', version: 1 });
  });

  it('reopens with a reason and keeps frozen and released versions unchanged', async () => {
    const h = harness();
    expect(await h.adapter.reopenReport('meiling', '  ', 'Reviewer', '2026-10-22T10:00:00.000Z')).toEqual({ ok: false, reason: 'reason-required' });
    const previous = await h.adapter.getReportVersions('meiling');
    expect(await h.adapter.reopenReport('meiling', 'Correct a detail', 'Reviewer', '2026-10-22T10:00:00.000Z')).toEqual({ ok: true, value: undefined });
    expect(h.state().reports.meiling.status).toBe('draft');
    expect(await h.adapter.getReportVersions('meiling')).toEqual(previous);
    expect((await h.adapter.getReportHistory('meiling')).at(-1)).toMatchObject({ type: 'reopened', reason: 'Correct a detail', version: 2 });
    expect(await h.adapter.reopenReport('meiling', 'Again', 'Reviewer', '2026-10-22T10:01:00.000Z')).toEqual({ ok: false, reason: 'invalid-target' });
  });

  it('seeds a version and matching append-only audit events for approved reports', async () => {
    const h = harness();
    for (const id of ['meiling', 'hana', 'nuraisyah', 'siti']) {
      expect((await h.adapter.getReportVersions(id))[0].version).toBe(1);
      expect((await h.adapter.getReportHistory(id)).some((event) => event.type === 'approved')).toBe(true);
      expect((await h.adapter.getAuditLog({ studentId: id })).some((event) => event.action === 'report.approved')).toBe(true);
    }
    expect((await h.adapter.getReportHistory('ethan')).some((event) => event.type === 'submitted')).toBe(true);
    expect((await h.adapter.getReportHistory('rayan')).some((event) => event.type === 'changesRequested')).toBe(true);
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
