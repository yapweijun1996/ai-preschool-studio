// Pure portfolio state + transitions. Kept free of React so it can be unit tested.
import {
  ARIA_PARAGRAPHS, ARIA_REFLECTION, NEXT_OBS_NUMBER, OBSERVATIONS, REVIEWER,
  TEACHER, STUDENTS, TODAY, draftFromObservations, seededDrafts,
  type Observation, type Paragraph, type ReportStatus, type Sentence
} from '../data/demo';
import { CURRENT_FRAMEWORK, DOMAINS, termOf, type DomainKey, type Milestone } from '../framework';
import type { Suggestion } from '../services/mockProvider';
import type { Role } from '../roles';
import { asInstant, now } from '../utils/clock';
import { auditEventForDecision } from './audit';
import { DEMO_CHILDREN, DEMO_CLASSES, DEMO_COLLECTORS, DEMO_GUARDIANS } from '../children/demo';
import type { AttendanceAmendment, AttendanceRecord, DemoCheckInCredential, PinLockoutState } from '../attendance/domain';
import { DEMO_ATTENDANCE_AMENDMENTS, DEMO_ATTENDANCE_RECORDS, DEMO_CHECK_IN_CREDENTIALS } from '../attendance/demo';
import {
  hasPrimaryGuardian, validateChild, validateCollector, validateGuardian, withdrawRefusal,
  type AuthorisedCollector, type Child, type Class, type Guardian
} from '../children/domain';

export interface ReportVersion {
  version: number;
  approvedAt: string;
  approvedBy: string;
  frameworkVersion: string;
  milestones: Record<DomainKey, Milestone | null>;
  paragraphs: Paragraph[];
  reflection: string;
  contentHash: string;
  releasedAt?: string;
  releasedBy?: string;
}

export type DecisionEvent =
  | { type: 'submitted'; at: string; by: string }
  | { type: 'changesRequested'; at: string; by: string; comment: string }
  | { type: 'approved'; at: string; by: string; version: number }
  | { type: 'released'; at: string; by: string; version: number }
  | { type: 'reopened'; at: string; by: string; reason: string; version: number };

export type AuditAction =
  | 'observation.added' | 'report.submitted' | 'report.changesRequested' | 'report.approved'
  | 'report.released' | 'report.reopened' | 'role.switched' | 'demo.reset' | 'child.updated'
  | 'child.withdrawn' | 'guardian.created' | 'guardian.updated' | 'guardian.removed'
  | 'collector.created' | 'collector.updated' | 'collector.removed'
  | 'attendance.marked' | 'attendance.amended' | 'attendance.departed' | 'attendance.checkin';
export type AuditSummaryKey =
  | 'pages.audit.summaryObservationAdded' | 'pages.audit.summarySubmitted'
  | 'pages.audit.summaryChangesRequested' | 'pages.audit.summaryApproved'
  | 'pages.audit.summaryReleased' | 'pages.audit.summaryReopened'
  | 'pages.audit.summaryRoleSwitched' | 'pages.audit.summaryReset'
  | 'pages.audit.summaryChildUpdated' | 'pages.audit.summaryChildWithdrawn'
  | 'pages.audit.summaryGuardianCreated' | 'pages.audit.summaryGuardianUpdated'
  | 'pages.audit.summaryGuardianRemoved' | 'pages.audit.summaryCollectorCreated'
  | 'pages.audit.summaryCollectorUpdated' | 'pages.audit.summaryCollectorRemoved'
  | 'pages.audit.summaryAttendanceMarked' | 'pages.audit.summaryAttendanceAmended'
  | 'pages.audit.summaryAttendanceDeparted' | 'pages.audit.summaryAttendanceCheckin';
export interface AuditEvent {
  id: string;
  at: string;
  actor: { role: Role | 'kiosk'; name: string };
  action: AuditAction;
  target: { type: 'student' | 'child' | 'demo'; id: string };
  summaryKey: AuditSummaryKey;
  summaryParams?: { version?: number };
  decision?: DecisionEvent;
}
export interface Actor { role: Role; name: string }

export interface ReportState {
  status: ReportStatus;
  hadChanges: boolean;
  comment?: { by: string; date: string; text: string };
  submittedAt?: string;
  approvedAt?: string;
  /** Learning Framework version the report was approved under; its labels stay with the report. */
  frameworkVersion?: string;
  /** Term 4 milestones as approved; later observations do not change an approved report. */
  milestones?: Record<DomainKey, Milestone | null>;
  approvedBy?: string;
  versions: ReportVersion[];
  reopenedAt?: string;
  releasedVersion?: number;
}

export interface State {
  observations: Observation[];
  paragraphs: Record<string, Paragraph[]>;
  reflections: Record<string, string>;
  reports: Record<string, ReportState>;
  sim: { aiDown: boolean; saveFail: boolean };
  nextObsNumber: number;
  auditEvents: AuditEvent[];
  nextAuditNumber: number;
  nextGuardianNumber: number;
  nextCollectorNumber: number;
  classes: Class[];
  children: Record<string, Child>;
  guardians: Guardian[];
  collectors: AuthorisedCollector[];
  attendanceRecords: AttendanceRecord[];
  attendanceAmendments: AttendanceAmendment[];
  attendanceCredentials: DemoCheckInCredential[];
  attendancePinLockouts: Record<string, PinLockoutState>;
  nextAttendanceNumber: number;
  nextAttendanceAmendmentNumber: number;
}

export type Action =
  | { type: 'addObservation'; obs: Omit<Observation, 'id'>; actor?: Actor; at?: string }
  | { type: 'startDraft'; studentId: string }
  | { type: 'fillMissingDomains'; studentId: string }
  | { type: 'linkSource'; studentId: string; sentenceId: string; obsId: string }
  | { type: 'removeSentence'; studentId: string; sentenceId: string }
  | { type: 'applySuggestion'; studentId: string; suggestion: Suggestion }
  | { type: 'restoreParagraph'; studentId: string; paragraph: Paragraph }
  | { type: 'setReflection'; studentId: string; text: string }
  | { type: 'submitForReview'; studentId: string; submittedAt: string; actor?: Actor }
  | { type: 'requestChanges'; studentId: string; text: string; date: string; actor?: Actor }
  | { type: 'approve'; studentId: string; at: string; approvedBy?: string; actor?: Actor }
  | { type: 'release'; studentId: string; at: string; releasedBy: string; actor?: Actor }
  | { type: 'reopen'; studentId: string; reason: string; at: string; reopenedBy: string; actor?: Actor }
  | { type: 'roleSwitched'; from: Role; to: Role; actor: Actor; at: string }
  | { type: 'setSim'; key: keyof State['sim']; value: boolean }
  | { type: 'updateChild'; child: Child; actor?: Actor; at?: string }
  | { type: 'upsertGuardian'; guardian: Guardian; actor?: Actor; at?: string }
  | { type: 'removeGuardian'; guardianId: string; actor?: Actor; at?: string }
  | { type: 'upsertCollector'; collector: AuthorisedCollector; actor?: Actor; at?: string }
  | { type: 'removeCollector'; collectorId: string; actor?: Actor; at?: string }
  | { type: 'withdrawChild'; childId: string; actor?: Actor; at?: string }
  | { type: 'attendanceChanged'; record: AttendanceRecord; amendments?: AttendanceAmendment[]; audit: 'marked' | 'amended' | 'departed' | 'checkin'; actor: Actor; auditActor?: AuditEvent['actor']; at: string }
  | { type: 'attendancePinLockout'; childCode: string; state?: PinLockoutState }
  | { type: 'reset'; actor?: Actor; at?: string };

export function initialState(): State {
  const reports: Record<string, ReportState> = {};
  for (const s of STUDENTS)
    reports[s.id] = {
      status: s.reportStatus,
      hadChanges: s.reportStatus === 'changes',
      versions: [],
      ...(s.reportStatus === 'review' ? { submittedAt: seededSubmissionDate(s.id) } : {}),
      ...(s.reportStatus === 'approved'
        ? { frameworkVersion: CURRENT_FRAMEWORK.version, milestones: milestonesFrom(OBSERVATIONS, s.id, 4) }
        : {})
    };
  reports.rayan.comment = {
    by: REVIEWER,
    date: '2026-10-20T08:30:00.000Z',
    text: 'Mathematics 数学 needs a second observation before we can say “Consistently demonstrated”.'
  };
  const seeded = seededDrafts();
  const seedDecisions: Record<string, DecisionEvent[]> = Object.fromEntries(
    STUDENTS.map((student) => [student.id, []])
  );
  for (const student of STUDENTS) {
    const report = reports[student.id];
    if (report.status === 'review') {
      seedDecisions[student.id] = [{
        type: 'submitted',
        at: report.submittedAt ?? `${TODAY}T09:00:00.000Z`,
        by: TEACHER
      }];
    }
    if (report.status === 'changes') seedDecisions[student.id] = [
      { type: 'submitted', at: '2026-10-19T09:00:00.000Z', by: TEACHER },
      {
        type: 'changesRequested',
        at: report.comment?.date ?? `${TODAY}T09:00:00.000Z`,
        by: REVIEWER,
        comment: report.comment?.text ?? ''
      }
    ];
    if (report.status === 'approved') {
      const approvedAt = `2026-10-${student.id === 'meiling' ? '20' : '18'}T09:00:00.000Z`;
      const approvedBy = REVIEWER;
      const paragraphs = cloneParagraphs(seeded.paragraphs[student.id] ?? []);
      const reflection = seeded.reflections[student.id] ?? '';
      const version: ReportVersion = {
        version: 1, approvedAt, approvedBy, frameworkVersion: CURRENT_FRAMEWORK.version,
        milestones: report.milestones ?? milestonesFrom(OBSERVATIONS, student.id, 4), paragraphs,
        reflection,
        contentHash: reportContentHash(
          paragraphs,
          reflection,
          CURRENT_FRAMEWORK.version,
          report.milestones ?? milestonesFrom(OBSERVATIONS, student.id, 4)
        ),
        ...(student.id === 'meiling' ? { releasedAt: '2026-10-21T02:00:00.000Z', releasedBy: REVIEWER } : {})
      };
      report.approvedAt = approvedAt;
      report.approvedBy = approvedBy;
      report.versions = [version];
      seedDecisions[student.id] = [{ type: 'approved', at: approvedAt, by: approvedBy, version: 1 }];
      if (version.releasedAt) {
        report.releasedVersion = 1;
        seedDecisions[student.id].push({ type: 'released', at: version.releasedAt, by: REVIEWER, version: 1 });
      }
    }
  }
  const seededAudit = STUDENTS.flatMap((student) => seedDecisions[student.id].map((decision) => {
    const actor = { role: decision.type === 'submitted' ? 'teacher' as const : 'reviewer' as const, name: decision.by };
    return auditEventForDecision(decision, student.id, actor);
  }))
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((event, index) => ({ ...event, id: `AUD-${String(index + 1).padStart(4, '0')}` }));
  return {
    observations: OBSERVATIONS,
    paragraphs: { ...seeded.paragraphs, aria: ARIA_PARAGRAPHS },
    reflections: { ...seeded.reflections, aria: ARIA_REFLECTION },
    reports,
    sim: { aiDown: false, saveFail: false },
    nextObsNumber: NEXT_OBS_NUMBER,
    auditEvents: seededAudit, nextAuditNumber: seededAudit.length + 1,
    nextGuardianNumber: DEMO_GUARDIANS.length + 1,
    nextCollectorNumber: DEMO_COLLECTORS.length + 1,
    classes: DEMO_CLASSES, children: DEMO_CHILDREN, guardians: DEMO_GUARDIANS, collectors: DEMO_COLLECTORS,
    attendanceRecords: DEMO_ATTENDANCE_RECORDS, attendanceAmendments: DEMO_ATTENDANCE_AMENDMENTS,
    attendanceCredentials: DEMO_CHECK_IN_CREDENTIALS, attendancePinLockouts: {},
    nextAttendanceNumber: DEMO_ATTENDANCE_RECORDS.length + 1,
    nextAttendanceAmendmentNumber: DEMO_ATTENDANCE_AMENDMENTS.length + 1
  };
}

function cloneParagraphs(paragraphs: Paragraph[]): Paragraph[] {
  return paragraphs.map((paragraph) => ({
    ...paragraph,
    sentences: paragraph.sentences.map((sentence) => ({ ...sentence, sources: [...sentence.sources] }))
  }));
}

export function reportContentHash(
  paragraphs: Paragraph[],
  reflection: string,
  frameworkVersion = CURRENT_FRAMEWORK.version,
  milestones?: Record<DomainKey, Milestone | null>
): string {
  const canonical = JSON.stringify(canonicalize({
    frameworkVersion,
    milestones: milestones ?? null,
    paragraphs,
    reflection
  }));
  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i += 1) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const sorted = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(sorted.map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

function appendAudit(state: State, event: Omit<AuditEvent, 'id'>): State {
  const id = `AUD-${String(state.nextAuditNumber).padStart(4, '0')}`;
  return {
    ...state,
    auditEvents: [...state.auditEvents, { ...event, id }],
    nextAuditNumber: state.nextAuditNumber + 1
  };
}
const defaultActor: Actor = { role: 'teacher', name: TEACHER };

function seededSubmissionDate(studentId: string): string {
  const dates: Record<string, string> = {
    ethan: '2026-10-16T09:00:00.000Z',
    daniel: '2026-10-18T09:00:00.000Z',
    priya: '2026-10-20T09:00:00.000Z',
    weiming: '2026-10-21T09:00:00.000Z'
  };
  return dates[studentId] ?? `${TODAY}T09:00:00.000Z`;
}

function mapSentences(state: State, studentId: string, fn: (s: Sentence) => Sentence | null): State {
  const paras = state.paragraphs[studentId];
  if (!paras) return state;
  const next = paras.map((p) => ({
    ...p,
    sentences: p.sentences.map(fn).filter((x): x is Sentence => x !== null)
  }));
  return { ...state, paragraphs: { ...state.paragraphs, [studentId]: next } };
}

const ownsObservation = (state: State, studentId: string, obsId: string) =>
  state.observations.some((o) => o.id === obsId && o.studentId === studentId);
/** Approved reports are frozen: no content action may change them. */
const contentLocked = (state: State, studentId: string) => state.reports[studentId]?.status === 'approved';
/** Wording is also paused while in review; linking evidence stays open so the reviewer can clear a blocked approval. */
const editLocked = (state: State, studentId: string) =>
  contentLocked(state, studentId) || state.reports[studentId]?.status === 'review';

function setReport(state: State, studentId: string, patch: Partial<ReportState>): State {
  return { ...state, reports: { ...state.reports, [studentId]: { ...state.reports[studentId], ...patch } } };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'addObservation': {
      const id = `OBS-${String(state.nextObsNumber).padStart(4, '0')}`;
      // The term follows the date, so a back-dated note never counts toward the current term;
      // a date outside every reporting period is refused.
      const term = termOf(action.obs.date);
      if (!term) return state;
      const obs = { ...action.obs, id, term };
      const withObservation = {
        ...state,
        observations: [obs, ...state.observations],
        nextObsNumber: state.nextObsNumber + 1
      };
      return appendAudit(withObservation, {
        at: asInstant(action.at ?? now()),
        actor: action.actor ?? defaultActor,
        action: 'observation.added',
        target: { type: 'student', id: obs.studentId },
        summaryKey: 'pages.audit.summaryObservationAdded'
      });
    }
    case 'fillMissingDomains': {
      const student = STUDENTS.find((x) => x.id === action.studentId);
      const status = state.reports[action.studentId]?.status;
      if (!student || (status !== 'draft' && status !== 'changes')) return state;
      const paras = state.paragraphs[action.studentId] ?? [];
      const written = new Set(paras.filter((p) => p.sentences.length > 0).map((p) => p.domain));
      const fresh = draftFromObservations(student, observationsFor(state, action.studentId))
        .filter((p) => !written.has(p.domain));
      if (fresh.length === 0) return state;
      const order = DOMAINS.map((d) => d.key);
      const merged = order
        .map((k) => fresh.find((p) => p.domain === k) ?? paras.find((p) => p.domain === k))
        .filter((p): p is Paragraph => !!p);
      return { ...state, paragraphs: { ...state.paragraphs, [action.studentId]: merged } };
    }
    case 'startDraft': {
      const student = STUDENTS.find((x) => x.id === action.studentId);
      const report = state.reports[action.studentId];
      if (
        !student || !report || report.status !== 'notStarted' ||
        (state.paragraphs[action.studentId]?.length ?? 0) > 0
      ) return state;
      const paragraphs = draftFromObservations(student, observationsFor(state, action.studentId));
      if (paragraphs.length === 0) return state;
      return setReport(
        { ...state, paragraphs: { ...state.paragraphs, [action.studentId]: paragraphs } },
        action.studentId,
        { status: 'draft' }
      );
    }
    case 'linkSource':
      if (
        contentLocked(state, action.studentId) ||
        !ownsObservation(state, action.studentId, action.obsId)
      ) return state;
      return mapSentences(state, action.studentId, (s) =>
        s.id === action.sentenceId && !s.sources.includes(action.obsId)
          ? { ...s, sources: [...s.sources, action.obsId] }
          : s
      );
    case 'removeSentence':
      if (editLocked(state, action.studentId)) return state;
      return mapSentences(state, action.studentId, (s) => (s.id === action.sentenceId ? null : s));
    case 'applySuggestion': {
      const paras = state.paragraphs[action.studentId] ?? [];
      const cited = action.suggestion.after.flatMap((x) => x.sources);
      if (
        editLocked(state, action.studentId) ||
        !paras.some((p) => p.id === action.suggestion.paragraphId) ||
        !cited.every((id) => ownsObservation(state, action.studentId, id))
      )
        return state;
      const next = paras.map((p) => (
        p.id === action.suggestion.paragraphId ? { ...p, sentences: action.suggestion.after } : p
      ));
      return { ...state, paragraphs: { ...state.paragraphs, [action.studentId]: next } };
    }
    case 'restoreParagraph': {
      if (editLocked(state, action.studentId)) return state;
      const paras = state.paragraphs[action.studentId] ?? [];
      const next = paras.map((p) => (p.id === action.paragraph.id ? action.paragraph : p));
      return { ...state, paragraphs: { ...state.paragraphs, [action.studentId]: next } };
    }
    case 'setReflection':
      if (editLocked(state, action.studentId)) return state;
      return { ...state, reflections: { ...state.reflections, [action.studentId]: action.text } };
    case 'submitForReview': {
      const r = state.reports[action.studentId];
      if (!r || r.status === 'approved' || r.status === 'review' || r.status === 'notStarted') return state;
      // Only a structurally complete draft goes to review.
      if (!readiness(state, action.studentId).canSubmit) return state;
      const actor = action.actor ?? defaultActor;
      const at = asInstant(action.submittedAt);
      const decision: DecisionEvent = { type: 'submitted', at, by: actor.name };
      const submitted = setReport(state, action.studentId, { status: 'review', submittedAt: at });
      return appendAudit(submitted, auditEventForDecision(decision, action.studentId, actor));
    }
    case 'requestChanges': {
      if (state.reports[action.studentId]?.status !== 'review') return state;
      const actor = action.actor ?? { role: 'reviewer' as const, name: REVIEWER };
      const at = asInstant(action.date);
      const decision: DecisionEvent = { type: 'changesRequested', at, by: actor.name, comment: action.text };
      const changed = setReport(state, action.studentId, {
        status: 'changes',
        hadChanges: true,
        comment: { by: actor.name, date: at, text: action.text }
      });
      return appendAudit(changed, auditEventForDecision(decision, action.studentId, actor));
    }
    case 'approve': {
      // Approval is blocked while any claim lacks evidence.
      if (!canApprove(state, action.studentId)) return state;
      const report = state.reports[action.studentId];
      const at = asInstant(action.at);
      const approvedBy = action.approvedBy ?? action.actor?.name ?? REVIEWER;
      const version = (report.versions.at(-1)?.version ?? 0) + 1;
      const paragraphs = cloneParagraphs(state.paragraphs[action.studentId] ?? []);
      const reflection = state.reflections[action.studentId] ?? '';
      const milestones = milestonesFrom(state.observations, action.studentId, 4);
      const versionRecord: ReportVersion = {
        version,
        approvedAt: at,
        approvedBy,
        frameworkVersion: CURRENT_FRAMEWORK.version,
        milestones,
        paragraphs,
        reflection,
        contentHash: reportContentHash(paragraphs, reflection, CURRENT_FRAMEWORK.version, milestones)
      };
      const actor = action.actor ?? { role: 'reviewer' as const, name: approvedBy };
      const decision: DecisionEvent = { type: 'approved', at, by: approvedBy, version };
      const approved = setReport(state, action.studentId, {
        status: 'approved',
        approvedAt: at,
        approvedBy,
        frameworkVersion: CURRENT_FRAMEWORK.version,
        milestones: versionRecord.milestones,
        versions: [...report.versions, versionRecord]
      });
      return appendAudit(approved, auditEventForDecision(decision, action.studentId, actor));
    }
    case 'release': {
      const report = state.reports[action.studentId];
      const latest = report?.versions.at(-1);
      if (!report || report.status !== 'approved' || !latest || report.releasedVersion === latest.version) return state;
      const at = asInstant(action.at);
      const actor = action.actor ?? { role: 'reviewer' as const, name: action.releasedBy };
      const decision: DecisionEvent = { type: 'released', at, by: action.releasedBy, version: latest.version };
      const version = { ...latest, releasedAt: at, releasedBy: action.releasedBy };
      const released = setReport(state, action.studentId, {
        versions: [...report.versions.slice(0, -1), version], releasedVersion: latest.version
      });
      return appendAudit(released, auditEventForDecision(decision, action.studentId, actor));
    }
    case 'reopen': {
      const report = state.reports[action.studentId];
      const reason = action.reason.trim();
      if (!report || report.status !== 'approved' || !reason) return state;
      const at = asInstant(action.at);
      const actor = action.actor ?? { role: 'reviewer' as const, name: action.reopenedBy };
      const decision: DecisionEvent = {
        type: 'reopened',
        at,
        by: action.reopenedBy,
        reason,
        version: (report.versions.at(-1)?.version ?? 0) + 1
      };
      const reopened = setReport(state, action.studentId, {
        status: 'draft', reopenedAt: at,
        approvedAt: undefined,
        approvedBy: undefined,
        frameworkVersion: undefined,
        milestones: undefined
      });
      return appendAudit(reopened, auditEventForDecision(decision, action.studentId, actor));
    }
    case 'roleSwitched':
      return appendAudit(state, {
        at: asInstant(action.at),
        actor: action.actor,
        action: 'role.switched',
        target: { type: 'demo', id: 'role' },
        summaryKey: 'pages.audit.summaryRoleSwitched'
      });
    case 'setSim':
      return { ...state, sim: { ...state.sim, [action.key]: action.value } };
    case 'updateChild': {
      const stored = state.children[action.child.id];
      if (
        !stored || stored.status !== action.child.status ||
        Object.keys(validateChild(action.child)).length > 0
      ) return state;
      const next = { ...state, children: { ...state.children, [action.child.id]: action.child } };
      return appendAudit(next, {
        at: asInstant(action.at ?? now()),
        actor: action.actor ?? defaultActor,
        action: 'child.updated',
        target: { type: 'child', id: action.child.id },
        summaryKey: 'pages.audit.summaryChildUpdated'
      });
    }
    case 'upsertGuardian': {
      const guardian = action.guardian;
      const stored = state.guardians.find((item) => item.id === guardian.id);
      if (stored && [...stored.childIds].sort().join('|') !== [...guardian.childIds].sort().join('|')) return state;
      if (
        !guardian.childIds.length ||
        guardian.childIds.some((id) => !state.children[id]) ||
        Object.keys(validateGuardian(guardian)).length > 0
      ) return state;
      const without = state.guardians.filter((item) => item.id !== guardian.id);
      const nextGuardians = [...without, guardian];
      const affected = new Set([...guardian.childIds, ...(stored?.childIds ?? [])]);
      if ([...affected].some((childId) => !hasPrimaryGuardian(nextGuardians, childId))) return state;
      const created = without.length === state.guardians.length;
      const actionName = created ? 'guardian.created' : 'guardian.updated';
      const summaryKey = created ? 'pages.audit.summaryGuardianCreated' : 'pages.audit.summaryGuardianUpdated';
      const next = {
        ...state,
        guardians: nextGuardians,
        nextGuardianNumber: created ? state.nextGuardianNumber + 1 : state.nextGuardianNumber
      };
      return [...affected].reduce((current, childId) => appendAudit(current, {
        at: asInstant(action.at ?? now()),
        actor: action.actor ?? defaultActor,
        action: actionName,
        target: { type: 'child', id: childId },
        summaryKey
      }), next);
    }
    case 'removeGuardian': {
      const guardian = state.guardians.find((item) => item.id === action.guardianId);
      if (!guardian) return state;
      const nextGuardians = state.guardians.filter((item) => item.id !== action.guardianId);
      if (
        guardian.isPrimary &&
        guardian.childIds.some((childId) => !hasPrimaryGuardian(nextGuardians, childId))
      ) return state;
      const next = { ...state, guardians: nextGuardians };
      return appendAudit(next, {
        at: asInstant(action.at ?? now()),
        actor: action.actor ?? defaultActor,
        action: 'guardian.removed',
        target: { type: 'child', id: guardian.childIds[0] },
        summaryKey: 'pages.audit.summaryGuardianRemoved'
      });
    }
    case 'upsertCollector': {
      const collector = action.collector;
      if (!state.children[collector.childId] || Object.keys(validateCollector(collector)).length > 0) return state;
      const stored = state.collectors.find((item) => item.id === collector.id);
      if (stored && stored.childId !== collector.childId) return state;
      const existing = !!stored;
      const next = {
        ...state,
        collectors: [...state.collectors.filter((item) => item.id !== collector.id), collector],
        nextCollectorNumber: existing ? state.nextCollectorNumber : state.nextCollectorNumber + 1
      };
      const actionName = existing ? 'collector.updated' : 'collector.created';
      const summaryKey = existing ? 'pages.audit.summaryCollectorUpdated' : 'pages.audit.summaryCollectorCreated';
      return appendAudit(next, {
        at: asInstant(action.at ?? now()),
        actor: action.actor ?? defaultActor,
        action: actionName,
        target: { type: 'child', id: collector.childId },
        summaryKey
      });
    }
    case 'removeCollector': {
      const collector = state.collectors.find((item) => item.id === action.collectorId);
      if (!collector) return state;
      const next = { ...state, collectors: state.collectors.filter((item) => item.id !== action.collectorId) };
      return appendAudit(next, {
        at: asInstant(action.at ?? now()),
        actor: action.actor ?? defaultActor,
        action: 'collector.removed',
        target: { type: 'child', id: collector.childId },
        summaryKey: 'pages.audit.summaryCollectorRemoved'
      });
    }
    case 'withdrawChild': {
      const child = state.children[action.childId];
      const refused = withdrawRefusal(child ? state.reports[action.childId]?.status : undefined);
      if (!child || refused || child.status === 'withdrawn') return state;
      const withdrawn: Child = { ...child, status: 'withdrawn' };
      const next = { ...state, children: { ...state.children, [child.id]: withdrawn } };
      return appendAudit(next, {
        at: asInstant(action.at ?? now()),
        actor: action.actor ?? defaultActor,
        action: 'child.withdrawn',
        target: { type: 'child', id: child.id },
        summaryKey: 'pages.audit.summaryChildWithdrawn'
      });
    }
    case 'attendanceChanged': {
      const records = state.attendanceRecords.some((item) => item.id === action.record.id)
        ? state.attendanceRecords.map((item) => item.id === action.record.id ? action.record : item)
        : [...state.attendanceRecords, action.record];
      const amendments = action.amendments?.length
        ? [...state.attendanceAmendments, ...action.amendments]
        : state.attendanceAmendments;
      const actionName = `attendance.${action.audit}` as AuditAction;
      const summaryKey = ({
        marked: 'pages.audit.summaryAttendanceMarked', amended: 'pages.audit.summaryAttendanceAmended',
        departed: 'pages.audit.summaryAttendanceDeparted', checkin: 'pages.audit.summaryAttendanceCheckin'
      } as const)[action.audit] as AuditSummaryKey;
      return appendAudit({
        ...state,
        attendanceRecords: records,
        attendanceAmendments: amendments,
        nextAttendanceNumber: Math.max(state.nextAttendanceNumber, Number(action.record.id.split('-').at(-1)) + 1 || 1),
        nextAttendanceAmendmentNumber: Math.max(state.nextAttendanceAmendmentNumber, action.amendments?.length ? Number(action.amendments.at(-1)!.id.split('-').at(-1)) + 1 || 1 : state.nextAttendanceAmendmentNumber)
      }, {
        at: action.at,
        actor: action.auditActor ?? { role: action.actor.role, name: action.actor.name },
        action: actionName,
        target: { type: 'child', id: action.record.childId },
        summaryKey
      });
    }
    case 'attendancePinLockout': {
      const lockouts = { ...state.attendancePinLockouts };
      if (action.state) lockouts[action.childCode] = action.state;
      else delete lockouts[action.childCode];
      return { ...state, attendancePinLockouts: lockouts };
    }
    case 'reset': {
      let fresh = initialState();
      fresh = appendAudit(fresh, {
        at: asInstant(action.at ?? now()),
        actor: action.actor ?? defaultActor,
        action: 'demo.reset',
        target: { type: 'demo', id: 'portfolio' },
        summaryKey: 'pages.audit.summaryReset'
      });
      return fresh;
    }
  }
}

export interface UnverifiedClaim {
  paragraphId: string;
  sentence: Sentence;
}

export function unverifiedClaims(state: State, studentId: string): UnverifiedClaim[] {
  const paras = state.paragraphs[studentId] ?? [];
  return paras.flatMap((p) => p.sentences
    .filter((s) => s.sources.length === 0)
    .map((sentence) => ({ paragraphId: p.id, sentence })));
}

/** What a report still needs before it can go to review or be approved. Computed from the real content. */
export interface Readiness {
  /** Domains with at least one sentence. */
  domainsWritten: number;
  domainsTotal: number;
  /** Sentences in the whole narrative. */
  sentences: number;
  unverified: number;
  hasReflection: boolean;
  /** Structurally complete: every domain written and a reflection. Unverified claims may still go to review. */
  canSubmit: boolean;
  /** Complete and every claim has evidence. */
  canApprove: boolean;
}

export function readiness(state: State, studentId: string): Readiness {
  const paras = state.paragraphs[studentId] ?? [];
  const written = new Set(paras.filter((p) => p.sentences.length > 0).map((p) => p.domain));
  const sentences = paras.reduce((n, p) => n + p.sentences.length, 0);
  const unverified = unverifiedClaims(state, studentId).length;
  const hasReflection = (state.reflections[studentId] ?? '').trim().length > 0;
  const domainsTotal = DOMAINS.length;
  const canSubmit = written.size === domainsTotal && hasReflection;
  return {
    domainsWritten: written.size,
    domainsTotal,
    sentences,
    unverified,
    hasReflection,
    canSubmit,
    canApprove: canSubmit && unverified === 0
  };
}

export type ApprovalBlock =
  | { reason: 'status'; status: ReportStatus }
  | { reason: 'incomplete'; readiness: Readiness }
  | { reason: 'claims'; count: number }
  | null;

export function approvalBlock(state: State, studentId: string): ApprovalBlock {
  const report = state.reports[studentId];
  if (!report || report.status !== 'review') return { reason: 'status', status: report?.status ?? 'notStarted' };
  const r = readiness(state, studentId);
  if (r.domainsWritten < r.domainsTotal || !r.hasReflection) return { reason: 'incomplete', readiness: r };
  return r.unverified > 0 ? { reason: 'claims', count: r.unverified } : null;
}

export function canApprove(state: State, studentId: string): boolean {
  return approvalBlock(state, studentId) === null;
}

/**
 * A domain's milestone is the one recorded on its most recent observation in that term;
 * null when the domain has no observation yet. Milestones are never set without evidence.
 */
export function milestonesFrom(
  observations: Observation[],
  studentId: string,
  term: 3 | 4
): Record<DomainKey, Milestone | null> {
  const obs = observations.filter((o) => o.studentId === studentId && o.term === term);
  const out = {} as Record<DomainKey, Milestone | null>;
  for (const d of DOMAINS) {
    const latest = obs.filter((o) => o.domain === d.key)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
    out[d.key] = latest ? latest.milestone : null;
  }
  return out;
}

export function observationsFor(state: State, studentId: string, term: 3 | 4 = 4): Observation[] {
  return state.observations.filter((o) => o.studentId === studentId && o.term === term);
}

export interface AuditFilters { action?: AuditAction; studentId?: string; from?: string; to?: string }
export function localDateKey(instant: string): string {
  const date = new Date(instant);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-` +
    `${String(date.getDate()).padStart(2, '0')}`;
}
export function selectAuditLog(events: AuditEvent[], filters: AuditFilters = {}): AuditEvent[] {
  return events.filter((event) =>
    (!filters.action || event.action === filters.action) &&
    (!filters.studentId || event.target.id === filters.studentId) &&
    (!filters.from || localDateKey(event.at) >= filters.from) &&
    (!filters.to || localDateKey(event.at) <= filters.to)
    ).sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || b.id.localeCompare(a.id));
}

export function selectReportHistory(events: AuditEvent[], studentId: string): DecisionEvent[] {
  const lastReset = events.map((event) => event.action).lastIndexOf('demo.reset');
  return events
    .slice(lastReset + 1)
    .filter((event) => event.target.type === 'student' && event.target.id === studentId && event.decision)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id))
    .flatMap((event) => event.decision ? [event.decision] : []);
}
