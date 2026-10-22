import type { DataPort, Draft, ObservationInput, PortRefusal, PortResult } from './port';
import { hasPrimaryGuardian, validateChild, validateCollector, validateGuardian } from '../children/domain';
import { classCoverage, needsAttention, reviewQueue } from '../coverage';
import { periodOf, frameworkFor } from '../framework';
import { STUDENTS, type Observation, type Paragraph } from './demo';
import { allSummaries, milestonesFor, studentSummary } from '../store/selectors';
import { now } from '../utils/clock';
import {
  approvalBlock,
  observationsFor,
  readiness,
  reducer,
  selectAuditLog,
  selectReportHistory,
  unverifiedClaims,
  type Action,
  type AuditFilters,
  type State
} from '../store/reducer';

const success = <T>(value: T): PortResult<T> => ({ ok: true, value });
const refusal = (reason: PortRefusal): PortResult<never> => ({ ok: false, reason });

export function createDemoAdapter(getState: () => State, dispatch: (a: Action) => void): DataPort {
  const run = <T>(action: Action, value: T, reason: PortRefusal): PortResult<T> => {
    const before = getState();
    if (reducer(before, action) === before) return refusal(reason);
    dispatch(action);
    return success(value);
  };

  const locked = (state: State, studentId: string): PortRefusal | undefined => {
    const status = state.reports[studentId]?.status;
    if (status === 'approved') return 'report-locked';
    if (status === 'review') return 'report-not-editable';
    return undefined;
  };

  return {
    async getCoverage(term) { return classCoverage(getState(), term); },
    async getNeedsAttention(term) { return needsAttention(getState(), term); },
    async getReviewQueue() { return reviewQueue(getState()); },
    async getReportVersions(studentId) { return getState().reports[studentId]?.versions ?? []; },
    async getReleasedVersion(studentId) {
      const report = getState().reports[studentId];
      return report?.versions.find((version) => version.version === report.releasedVersion);
    },
    async getReportHistory(studentId) { return selectReportHistory(getState().auditEvents, studentId); },
    async getAuditLog(filters: AuditFilters = {}) { return selectAuditLog(getState().auditEvents, filters); },
    async getClasses() { return getState().classes; },
    async getChild(id) { return getState().children[id]; },
    async getGuardians(childId) { return getState().guardians.filter((guardian) => guardian.childIds.includes(childId)); },
    async getCollectors(childId) { return getState().collectors.filter((collector) => collector.childId === childId); },
    async updateChild(child, actor) {
      const state = getState();
      if (!state.children[child.id]) return refusal('unknown-child');
      if (Object.keys(validateChild(child)).length > 0 || !state.classes.some((item) => item.id === child.classId)) return refusal('invalid-child');
      return run({ type: 'updateChild', child, actor }, child, 'invalid-child');
    },
    async upsertGuardian(guardian, actor) {
      const state = getState();
      if (guardian.childIds.length === 0 || guardian.childIds.some((id) => !state.children[id])) return refusal('unknown-child');
      if (Object.keys(validateGuardian(guardian)).length > 0) return refusal('invalid-guardian');
      const affected = new Set([...guardian.childIds, ...(state.guardians.find((item) => item.id === guardian.id)?.childIds ?? [])]);
      const candidate = [...state.guardians.filter((item) => item.id !== guardian.id), guardian];
      if ([...affected].some((childId) => !hasPrimaryGuardian(candidate, childId))) return refusal('primary-guardian-required');
      return run({ type: 'upsertGuardian', guardian, actor }, guardian, 'invalid-guardian');
    },
    async removeGuardian(guardianId, actor) {
      const state = getState();
      const guardian = state.guardians.find((item) => item.id === guardianId);
      if (!guardian) return refusal('unknown-guardian');
      const candidate = state.guardians.filter((item) => item.id !== guardianId);
      if (guardian.isPrimary && guardian.childIds.some((childId) => !hasPrimaryGuardian(candidate, childId))) return refusal('primary-guardian-required');
      return run({ type: 'removeGuardian', guardianId, actor }, undefined, 'unknown-guardian');
    },
    async upsertCollector(collector, actor) {
      const state = getState();
      if (!state.children[collector.childId]) return refusal('unknown-child');
      if (Object.keys(validateCollector(collector)).length > 0) return refusal('invalid-collector');
      return run({ type: 'upsertCollector', collector, actor }, collector, 'invalid-collector');
    },
    async removeCollector(collectorId, actor) {
      if (!getState().collectors.some((item) => item.id === collectorId)) return refusal('unknown-collector');
      return run({ type: 'removeCollector', collectorId, actor }, undefined, 'unknown-collector');
    },
    async withdrawChild(childId, actor) {
      const state = getState();
      const child = state.children[childId];
      if (!child) return refusal('unknown-child');
      if (state.reports[childId]?.status === 'review') return refusal('report-in-review');
      if (child.status === 'withdrawn') return refusal('invalid-target');
      dispatch({ type: 'withdrawChild', childId, actor });
      return success({ ...child, status: 'withdrawn' });
    },
    async getStudentSummary(studentId) { return studentSummary(getState(), studentId); },
    async getCurrentFramework() { return frameworkFor(undefined); },
    async getPeriod(date) { return periodOf(date); },
    async addObservation(input: ObservationInput) {
      const state = getState();
      if (!STUDENTS.some((student) => student.id === input.studentId)) return refusal('unknown-student');
      const period = periodOf(input.date);
      if (!period) return refusal('date-outside-period');
      const obs: Observation = { ...input, id: '', term: period.term };
      const next = reducer(state, { type: 'addObservation', obs });
      if (next === state) return refusal('date-outside-period');
      dispatch({ type: 'addObservation', obs });
      return success(next.observations[0]);
    },
    async getAllSummaries() { return allSummaries(getState()); },
    async getMilestones(studentId, term = 4) { return milestonesFor(getState(), studentId, term); },
    async getObservations(studentId, term = 4) { return observationsFor(getState(), studentId, term); },
    async getReadiness(studentId) { return readiness(getState(), studentId); },
    async getUnverifiedClaims(studentId) { return unverifiedClaims(getState(), studentId); },
    async getDraft(studentId): Promise<Draft> {
      const state = getState();
      return { paragraphs: state.paragraphs[studentId] ?? [], reflection: state.reflections[studentId] ?? '' };
    },
    async getFramework(version) { return frameworkFor(version); },
    async startDraft(studentId) {
      const state = getState();
      if (!STUDENTS.some((student) => student.id === studentId)) return refusal('unknown-student');
      if (!observationsFor(state, studentId).length) return refusal('no-observations');
      return run({ type: 'startDraft', studentId }, undefined, 'invalid-target');
    },
    async fillMissingDomains(studentId) {
      const state = getState();
      const lock = locked(state, studentId);
      if (lock) return refusal(lock);
      return run({ type: 'fillMissingDomains', studentId }, undefined, 'invalid-target');
    },
    async linkSource(studentId, sentenceId, obsId) {
      const state = getState();
      const belongsToStudent = state.observations.some(
        (obs) => obs.id === obsId && obs.studentId === studentId
      );
      if (!belongsToStudent) return refusal('wrong-child-observation');
      if (state.reports[studentId]?.status === 'approved') return refusal('report-locked');
      return run({ type: 'linkSource', studentId, sentenceId, obsId }, undefined, 'invalid-target');
    },
    async removeSentence(studentId, sentenceId) {
      const lock = locked(getState(), studentId);
      if (lock) return refusal(lock);
      return run({ type: 'removeSentence', studentId, sentenceId }, undefined, 'invalid-target');
    },
    async applySuggestion(studentId, suggestion) {
      const state = getState();
      const lock = locked(state, studentId);
      if (lock) return refusal(lock);
      if (
        !suggestion.after
          .flatMap((sentence) => sentence.sources)
          .every((id) => state.observations.some((obs) => obs.id === id && obs.studentId === studentId))
      )
        return refusal('wrong-child-observation');
      return run({ type: 'applySuggestion', studentId, suggestion }, undefined, 'invalid-target');
    },
    async restoreParagraph(studentId, paragraph: Paragraph) {
      const lock = locked(getState(), studentId);
      if (lock) return refusal(lock);
      return run({ type: 'restoreParagraph', studentId, paragraph }, undefined, 'invalid-target');
    },
    async setReflection(studentId, text) {
      const lock = locked(getState(), studentId);
      if (lock) return refusal(lock);
      dispatch({ type: 'setReflection', studentId, text });
      return success(undefined);
    },
    async submitForReview(studentId) {
      if (!readiness(getState(), studentId).canSubmit) return refusal('not-ready');
      return run({ type: 'submitForReview', studentId, submittedAt: now() }, undefined, 'invalid-target');
    },
    async getApprovalBlock(studentId) { return approvalBlock(getState(), studentId); },
    async requestChanges(studentId, text, date) {
      if (getState().reports[studentId]?.status !== 'review') return refusal('report-not-editable');
      dispatch({ type: 'requestChanges', studentId, text, date });
      return success(undefined);
    },
    async approve(studentId, approvedBy, at) {
      const state = getState();
      const block = approvalBlock(state, studentId);
      if (block?.reason === 'claims') return refusal('unverified-claims');
      if (block?.reason === 'incomplete') return refusal('not-ready');
      if (block) return refusal('invalid-target');
      dispatch({ type: 'approve', studentId, at, approvedBy });
      return success({ approvedBy, at });
    },
    async releaseReport(studentId, releasedBy, at) {
      const report = getState().reports[studentId];
      if (!report) return refusal('unknown-student');
      const latest = report.versions.at(-1);
      if (report.status !== 'approved' || !latest) return refusal('not-approved');
      if (report.releasedVersion === latest.version) return success(undefined);
      return run({ type: 'release', studentId, at, releasedBy }, undefined, 'invalid-target');
    },
    async reopenReport(studentId, reason, reopenedBy, at) {
      const report = getState().reports[studentId];
      if (!report) return refusal('unknown-student');
      if (!reason.trim()) return refusal('reason-required');
      if (report.status !== 'approved') return refusal('invalid-target');
      return run({ type: 'reopen', studentId, reason, reopenedBy, at }, undefined, 'invalid-target');
    }
  };
}

