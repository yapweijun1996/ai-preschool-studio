import type { DataPort, Draft, ObservationInput, PortRefusal, PortResult } from './port';
import {
  hasPrimaryGuardian,
  validateChild,
  validateCollector,
  validateGuardian,
  withdrawRefusal
} from '../children/domain';
import type { Child } from '../children/domain';
import {
  canAmend, canMark, checkInMethods, dailySummary, dateInAttendanceZone, isLate,
  validateAmendmentReason, validateAmendmentValue, validateRecord,
  type AttendanceAmendment, type AttendanceRecord, type AttendanceRow, type AttendanceStatus
} from '../attendance/domain';
import type { AttendanceMarkAbsentInput, AttendanceMarkPresentInput, AttendanceRegister, AttendanceAmendInput } from './port';
import { PIN_ATTEMPTS_BEFORE_LOCKOUT, PIN_LOCKOUT_MS } from '../attendance/policy';
import { TEACHER } from './demo';
import { classCoverage, needsAttention, reviewQueue } from '../coverage';
import { periodOf, frameworkFor } from '../framework';
import { STUDENTS, type Observation, type Paragraph } from './demo';
import { allSummaries, milestonesFor, studentSummary } from '../store/selectors';
import { now, demoNow } from '../utils/clock';
import { can } from '../roles';
import {
  approvalBlock,
  observationsFor,
  readiness,
  reducer,
  selectAuditLog,
  selectReportHistory,
  unverifiedClaims,
  type Action,
  type Actor,
  type AuditFilters,
  type State
} from '../store/reducer';

const success = <T>(value: T): PortResult<T> => ({ ok: true, value });
const refusal = (reason: PortRefusal): PortResult<never> => ({ ok: false, reason });

export function createDemoAdapter(getState: () => State, dispatch: (a: Action) => void, clock: () => Date = demoNow): DataPort {
  const attendanceNow = () => now(clock);
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

  const canReadAttendance = (classId: string, actor: Actor): boolean => {
    if (!can(actor.role, 'attendance.view')) return false;
    if (actor.role !== 'teacher') return true;
    const klass = getState().classes.find((item) => item.id === classId);
    return actor.name === TEACHER && !!klass?.teacherIds.includes('teacher-lim');
  };
  const actorId = (actor: Actor): string => {
    if (actor.name === 'Fictional kiosk') return 'check-in-kiosk';
    if (actor.role === 'teacher') return 'teacher-lim';
    if (actor.role === 'reviewer') return 'reviewer-tan';
    if (actor.role === 'admin') return 'admin-wong';
    return 'parent-aria';
  };
  const registerFor = (classId: string, date: string, actor: Actor): AttendanceRegister => {
    const state = getState();
    if (!canReadAttendance(classId, actor)) return { date, rows: [] };
    const records = state.attendanceRecords.filter((record) => record.classId === classId && record.date === date);
    const recordByChild = new Map(records.map((record) => [record.childId, record]));
    const children = Object.values(state.children).filter((child) => child.classId === classId && (
      child.status === 'active' || (date !== dateInAttendanceZone(attendanceNow()) && recordByChild.has(child.id))
    ));
    return {
      date,
      rows: children.map((child): AttendanceRow => {
        const record = recordByChild.get(child.id);
        const { notes: _notes, ...attendanceChild } = child;
        return { child: attendanceChild, ...(record ? { record } : {}), late: !!record && record.status === 'present' && isLate(record.arrivedAt) };
      })
    };
  };
  const makeRecord = (
    childId: string, status: AttendanceStatus, method: AttendanceRecord['method'],
    atIso: string, markedBy: string, arrivedAt?: string, absenceReason?: AttendanceRecord['absenceReason']
  ): AttendanceRecord => ({
    id: `ATT-${String(getState().nextAttendanceNumber).padStart(4, '0')}`,
    childId, classId: getState().children[childId].classId,
    date: dateInAttendanceZone(atIso), status,
    ...(arrivedAt ? { arrivedAt } : {}), ...(method ? { method } : {}),
    ...(absenceReason ? { absenceReason } : {}), markedBy, markedAt: atIso
  });
  const mark = (
    childId: string, status: AttendanceStatus, method: AttendanceRecord['method'],
    atIso: string, arrivedAt?: string, absenceReason?: AttendanceRecord['absenceReason'],
    actor: Actor = { role: 'teacher', name: TEACHER }, audit: 'marked' | 'checkin' = 'marked', kiosk = false
  ): PortResult<AttendanceRecord> => {
    const state = getState();
    const child = state.children[childId];
    const date = dateInAttendanceZone(atIso);
    const current = state.attendanceRecords.find((record) => record.childId === childId && record.date === date);
    if (!child || (kiosk ? child.status !== 'active' : (!can(actor.role, 'attendance.mark') || !canReadAttendance(child.classId, actor)))) return refusal('not-permitted');
    if (method === 'face-placeholder') return refusal('consent-not-recorded');
    const gate = canMark({ child, classId: child?.classId ?? '', date, nowIso: atIso, existing: current });
    if (gate) return refusal(gate);
    const record = makeRecord(childId, status, method, atIso, kiosk ? 'kiosk' : actorId(actor), arrivedAt, absenceReason);
    const invalid = validateRecord(record, atIso);
    if (invalid) return refusal(invalid);
    dispatch({ type: 'attendanceChanged', record, audit, actor, ...(kiosk ? { auditActor: { role: 'kiosk', name: 'check-in-kiosk' } } : {}), at: atIso });
    return success(record);
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
    async getClasses(actor) { return can(actor.role, 'students.view') ? getState().classes : []; },
    async getAllChildren(actor) {
      if (!can(actor.role, 'students.view')) return [];
      const children = Object.values(getState().children);
      return can(actor.role, 'health.view') ? children : children.map(({ notes: _notes, ...child }) => child);
    },
    async getChild(id, actor) {
      if (!can(actor.role, 'students.view')) return undefined;
      const child = getState().children[id];
      if (!child) return undefined;
      if (can(actor.role, 'health.view')) return child;
      const { notes: _notes, ...basics } = child;
      return basics;
    },
    async getGuardians(childId, actor) {
      if (!can(actor.role, 'students.view')) return [];
      const guardians = getState().guardians.filter((guardian) => guardian.childIds.includes(childId));
      if (can(actor.role, 'contacts.view')) return guardians;
      return guardians.map((guardian) => ({
        ...guardian,
        name: 'Restricted',
        relationship: 'Restricted',
        phone: guardian.phone.replace(/^(\+65 9)\d{3}( \d{4})$/, '$1•••$2'),
        email: guardian.email.replace(/^[^@]+/, '••••••••')
      }));
    },
    async getCollectors(childId, actor) {
      if (!can(actor.role, 'students.view')) return [];
      const collectors = getState().collectors.filter((collector) => collector.childId === childId);
      if (can(actor.role, 'contacts.view')) return collectors;
      return collectors.map((collector) => ({
        ...collector,
        name: 'Restricted',
        relationship: 'Restricted',
        note: ''
      }));
    },
    async updateChild(child, actor) {
      const state = getState();
      const stored = state.children[child.id];
      if (!stored) return refusal('unknown-child');
      if (stored.status !== child.status) return refusal('status-change-not-allowed');
      const updated: Child = { ...child, notes: child.notes ?? stored.notes };
      if (
        Object.keys(validateChild(updated)).length > 0 ||
        !state.classes.some((item) => item.id === updated.classId)
      ) return refusal('invalid-child');
      return run({ type: 'updateChild', child: updated, actor }, updated, 'invalid-child');
    },
    async upsertGuardian(guardian, actor) {
      const state = getState();
      if (
        guardian.childIds.length === 0 ||
        guardian.childIds.some((id) => !state.children[id])
      ) return refusal('unknown-child');
      const stored = state.guardians.find((item) => item.id === guardian.id);
      if (
        stored &&
        [...stored.childIds].sort().join('|') !== [...guardian.childIds].sort().join('|')
      ) return refusal('record-child-mismatch');
      if (Object.keys(validateGuardian(guardian)).length > 0) return refusal('invalid-guardian');
      const affected = new Set([
        ...guardian.childIds,
        ...(state.guardians.find((item) => item.id === guardian.id)?.childIds ?? [])
      ]);
      const candidate = [...state.guardians.filter((item) => item.id !== guardian.id), guardian];
      if ([...affected].some((childId) => !hasPrimaryGuardian(candidate, childId))) {
        return refusal('primary-guardian-required');
      }
      return run({ type: 'upsertGuardian', guardian, actor }, guardian, 'invalid-guardian');
    },
    async removeGuardian(guardianId, actor) {
      const state = getState();
      const guardian = state.guardians.find((item) => item.id === guardianId);
      if (!guardian) return refusal('unknown-guardian');
      const candidate = state.guardians.filter((item) => item.id !== guardianId);
      if (guardian.isPrimary && guardian.childIds.some((childId) => !hasPrimaryGuardian(candidate, childId))) {
        return refusal('primary-guardian-required');
      }
      return run({ type: 'removeGuardian', guardianId, actor }, undefined, 'unknown-guardian');
    },
    async upsertCollector(collector, actor) {
      const state = getState();
      if (!state.children[collector.childId]) return refusal('unknown-child');
      const existing = state.collectors.find((item) => item.id === collector.id);
      if (existing && existing.childId !== collector.childId) return refusal('record-child-mismatch');
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
      const blocked = withdrawRefusal(state.reports[childId]?.status);
      if (blocked) return refusal(blocked);
      if (child.status === 'withdrawn') return refusal('invalid-target');
      dispatch({ type: 'withdrawChild', childId, actor });
      return success({ ...child, status: 'withdrawn' });
    },
    async getAttendanceRegister(classId, date, actor): Promise<AttendanceRegister> {
      return registerFor(classId, date, actor);
    },
    async getAttendanceSummary(classId, date, actor) {
      return dailySummary(registerFor(classId, date, actor).rows);
    },
    async markPresent(childId: string, input: AttendanceMarkPresentInput, actor) {
      return mark(childId, 'present', input.method, attendanceNow(), input.arrivedAt, undefined, actor);
    },
    async markAbsent(childId: string, input: AttendanceMarkAbsentInput, actor) {
      return mark(childId, 'absent', 'staff', attendanceNow(), undefined, input.reason, actor);
    },
    async markRemainingPresent(classId, actor) {
      if (!can(actor.role, 'attendance.mark') || !canReadAttendance(classId, actor)) return refusal('not-permitted');
      const at = attendanceNow();
      const rows = registerFor(classId, dateInAttendanceZone(at), actor).rows;
      const created: AttendanceRecord[] = [];
      for (const row of rows.filter((item) => !item.record)) {
        const result = mark(row.child.id, 'present', 'staff', at, at, undefined, actor);
        if (!result.ok) return result;
        created.push(result.value);
      }
      return success(created);
    },
    async amendAttendance(recordId, input: AttendanceAmendInput, actor) {
      if (!can(actor.role, 'attendance.amend')) return refusal('not-permitted');
      const state = getState();
      const existing = state.attendanceRecords.find((record) => record.id === recordId);
      if (!existing) return refusal('unknown-record');
      const reasonRefusal = validateAmendmentReason(input.reason);
      if (reasonRefusal) return refusal(reasonRefusal);
      const today = dateInAttendanceZone(attendanceNow());
      const permitted = canAmend({
        role: actor.role, date: existing.date, today,
        actorClassIds: actor.name === TEACHER ? state.classes.filter((item) => item.teacherIds.includes('teacher-lim')).map((item) => item.id) : [],
        recordClassId: existing.classId
      });
      if (permitted) return refusal(permitted);
      const value = input.to === undefined || input.to === '' ? undefined : input.to;
      const invalidValue = validateAmendmentValue(input.field, value, existing, attendanceNow());
      if (invalidValue) return refusal(invalidValue);
      const previous = existing[input.field];
      const amended = { ...existing, [input.field]: value } as AttendanceRecord;
      if (input.field === 'status' && amended.status === 'present') {
        delete amended.absenceReason;
        amended.arrivedAt ??= existing.markedAt;
        amended.method ??= 'staff';
      }
      if (input.field === 'status' && amended.status === 'absent') {
        delete amended.arrivedAt;
        delete amended.departedAt;
        amended.absenceReason ??= 'other';
      }
      const invalid = validateRecord(amended, attendanceNow());
      if (invalid) return refusal(invalid);
      const at = attendanceNow();
      const changes: Array<{ field: AttendanceAmendment['field']; from?: string; to?: string }> = [{
        field: input.field, ...(previous !== undefined ? { from: String(previous) } : {}), ...(value !== undefined ? { to: value } : {})
      }];
      if (input.field === 'status') {
        for (const field of ['arrivedAt', 'departedAt', 'absenceReason'] as const) {
          if (existing[field] !== amended[field]) changes.push({ field, ...(existing[field] !== undefined ? { from: existing[field] } : {}), ...(amended[field] !== undefined ? { to: amended[field] } : {}) });
        }
      }
      const amendments = changes.map((change, index): AttendanceAmendment => ({
        id: `AMEND-${String(state.nextAttendanceAmendmentNumber + index).padStart(4, '0')}`,
        recordId, childId: existing.childId, date: existing.date, ...change,
        reason: input.reason.trim(), by: actorId(actor), at
      }));
      dispatch({ type: 'attendanceChanged', record: amended, amendments, audit: 'amended', actor, at });
      return success(amendments);
    },
    async getAmendments(recordId, actor) {
      const record = getState().attendanceRecords.find((item) => item.id === recordId);
      if (!record || !canReadAttendance(record.classId, actor)) return [];
      return getState().attendanceAmendments.filter((item) => item.recordId === recordId);
    },
    async recordDeparture(childId, departedAt, actor) {
      const state = getState();
      if (!can(actor.role, 'attendance.mark')) return refusal('not-permitted');
      const today = dateInAttendanceZone(attendanceNow());
      const date = dateInAttendanceZone(departedAt);
      if (date !== today) return refusal('past-date');
      const record = state.attendanceRecords.find((item) => item.childId === childId && item.date === date);
      if (!record || record.status !== 'present') return refusal('not-present');
      if (!canReadAttendance(record.classId, actor)) return refusal('not-permitted');
      if (record.departedAt) return refusal('already-departed');
      const updated = { ...record, departedAt };
      const invalid = validateRecord(updated, attendanceNow());
      if (invalid) return refusal(invalid);
      dispatch({ type: 'attendanceChanged', record: updated, audit: 'departed', actor, at: attendanceNow() });
      return success(updated);
    },
    async checkInWithPin(childCode, pin) {
      const atIso = attendanceNow();
      const state = getState();
      const credential = state.attendanceCredentials.find((item) => item.childCode === childCode);
      if (!credential) return refusal('pin-invalid');
      const lockout = state.attendancePinLockouts[childCode];
      if (lockout?.lockedUntil && Date.parse(lockout.lockedUntil) > Date.parse(atIso)) return refusal('pin-locked');
      if (credential.pin !== pin) {
        const attempts = lockout && lockout.lockedUntil && Date.parse(lockout.lockedUntil) <= Date.parse(atIso)
          ? 0 : lockout?.failedAttempts ?? 0;
        const failedAttempts = attempts + 1;
        dispatch({ type: 'attendancePinLockout', childCode, state: {
          failedAttempts,
          ...(failedAttempts >= PIN_ATTEMPTS_BEFORE_LOCKOUT ? { lockedUntil: new Date(Date.parse(atIso) + PIN_LOCKOUT_MS).toISOString() } : {})
        } });
        return refusal(failedAttempts >= PIN_ATTEMPTS_BEFORE_LOCKOUT ? 'pin-locked' : 'pin-invalid');
      }
      dispatch({ type: 'attendancePinLockout', childCode });
      const child = state.children[credential.childId];
      if (!child) return refusal('unknown-child');
      return mark(child.id, 'present', 'pin', atIso, atIso, undefined, { role: 'teacher', name: TEACHER }, 'checkin', true);
    },
    async checkInWithQr(cardId) {
      const atIso = attendanceNow();
      const credential = getState().attendanceCredentials.find((item) => item.cardId === cardId);
      if (!credential) return refusal('unknown-card');
      return mark(credential.childId, 'present', 'qr', atIso, atIso, undefined, { role: 'teacher', name: TEACHER }, 'checkin', true);
    },
    async getCheckInMethods(childId) {
      if (!getState().children[childId]) return checkInMethods(false);
      // No seeded child has face-match consent recorded.
      return checkInMethods(false);
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
    async getAllSummaries(actor) { return can(actor.role, 'students.view') ? allSummaries(getState()) : []; },
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

