import type { Observation, Paragraph } from './demo';
import type { Framework, DomainKey, Milestone, ReportingPeriod } from '../framework';
import type { ApprovalBlock, AuditEvent, AuditFilters, DecisionEvent, Readiness, ReportVersion, UnverifiedClaim } from '../store/reducer';
import type { StudentSummary } from '../store/selectors';
import type { Suggestion } from '../services/mockProvider';
import type { ClassCoverage, CoverageStudent, ReviewQueue } from '../coverage';
import type { AuthorisedCollector, Child, Class, Guardian } from '../children/domain';
import type { Actor } from '../store/reducer';
import type {
  AbsenceReason, AttendanceAmendment, AttendanceMethod, AttendanceRecord,
  AttendanceRow, AttendanceSummary, CheckInMethodAvailability
} from '../attendance/domain';

export type PortRefusal =
  | 'unknown-student'
  | 'wrong-child-observation'
  | 'date-outside-period'
  | 'report-locked'
  | 'report-not-editable'
  | 'not-ready'
  | 'unverified-claims'
  | 'invalid-target'
  | 'no-observations'
  | 'not-approved'
  | 'reason-required'
  | 'unknown-child'
  | 'invalid-child'
  | 'unknown-guardian'
  | 'invalid-guardian'
  | 'primary-guardian-required'
  | 'unknown-collector'
  | 'invalid-collector'
  | 'report-in-review'
  | 'record-child-mismatch'
  | 'status-change-not-allowed'
  | 'not-today' | 'already-marked' | 'child-withdrawn' | 'invalid-time' | 'past-date'
  | 'not-permitted' | 'not-present' | 'already-departed' | 'pin-invalid' | 'pin-locked'
  | 'consent-not-recorded'
  | 'unknown-card' | 'unknown-record';

export interface AttendanceRegister { date: string; rows: AttendanceRow[] }
export interface AttendanceMarkPresentInput { arrivedAt: string; method: AttendanceMethod }
export interface AttendanceMarkAbsentInput { reason: AbsenceReason }
export interface AttendanceAmendInput { field: 'status' | 'arrivedAt' | 'departedAt' | 'absenceReason'; to?: string; reason: string }


export type PortResult<T> = { ok: true; value: T } | { ok: false; reason: PortRefusal };
export type ChildRead = Omit<Child, 'notes'> & { notes?: Child['notes'] };
export type Draft = { paragraphs: Paragraph[]; reflection: string };
export type ObservationInput = Omit<Observation, 'id' | 'term'>;

export interface DataPort {
  // Observations
  /** Returns the existing summary, or undefined when the child is unknown. */
  getStudentSummary(studentId: string): Promise<StudentSummary | undefined>;
  /** Returns the currently published framework. */
  getCurrentFramework(): Promise<Framework>;
  /** Finds the configured reporting period containing the date. */
  getPeriod(date: string): Promise<ReportingPeriod | undefined>;
  /** Rejects dates outside all configured reporting periods. */
  addObservation(input: ObservationInput): Promise<PortResult<Observation>>;

  // Learning progress
  /** Returns summaries for all available students. */
  getAllSummaries(actor: Actor): Promise<StudentSummary[]>;
  /** Derives each domain milestone from its latest observation in the selected term. */
  getMilestones(studentId: string, term?: 3 | 4): Promise<Record<DomainKey, Milestone | null>>;
  /** Filters observations by child and selected term. */
  getObservations(studentId: string, term?: 3 | 4): Promise<Observation[]>;

  // Portfolio studio
  /** Computes report readiness from narrative, reflection and claims. */
  getReadiness(studentId: string): Promise<Readiness>;
  /** Returns narrative claims with no evidence sources. */
  getUnverifiedClaims(studentId: string): Promise<UnverifiedClaim[]>;
  /** Returns the child's saved narrative and reflection, or empty defaults. */
  getDraft(studentId: string): Promise<Draft>;
  /** Returns the requested framework version or the current version fallback. */
  getFramework(version?: string): Promise<Framework>;
  /** Starts a draft only for a not-started child with observations. */
  startDraft(studentId: string): Promise<PortResult<void>>;
  /** Fills unwritten domains only while a draft or changes-requested report is editable. */
  fillMissingDomains(studentId: string): Promise<PortResult<void>>;
  /** Links evidence owned by this child and rejects approved reports. */
  linkSource(studentId: string, sentenceId: string, obsId: string): Promise<PortResult<void>>;
  /** Removes a sentence only while report wording is editable. */
  removeSentence(studentId: string, sentenceId: string): Promise<PortResult<void>>;
  /** Applies a suggestion only to an existing paragraph with same-child evidence. */
  applySuggestion(studentId: string, suggestion: Suggestion): Promise<PortResult<void>>;
  /** Restores a paragraph only while report wording is editable. */
  restoreParagraph(studentId: string, paragraph: Paragraph): Promise<PortResult<void>>;
  /** Saves reflection only while report wording is editable. */
  setReflection(studentId: string, text: string): Promise<PortResult<void>>;
  /** Submits only structurally complete drafts with every domain and a reflection. */
  submitForReview(studentId: string): Promise<PortResult<void>>;

  // Report review
  /** Explains why the report cannot currently be approved. */
  getApprovalBlock(studentId: string): Promise<ApprovalBlock>;
  /** Requests changes only for reports currently in review. */
  requestChanges(studentId: string, text: string, date: string): Promise<PortResult<void>>;
  /** Approves only review reports with complete readiness and verified claims. */
  approve(studentId: string, approvedBy: string, atIso: string): Promise<PortResult<{ approvedBy: string; at: string }>>;
  releaseReport(studentId: string, releasedBy: string, atIso: string): Promise<PortResult<void>>;
  reopenReport(studentId: string, reason: string, reopenedBy: string, atIso: string): Promise<PortResult<void>>;
  getReportVersions(studentId: string): Promise<ReportVersion[]>;
  /** Returns the frozen version currently released to families, if any. */
  getReleasedVersion(studentId: string): Promise<ReportVersion | undefined>;
  getReportHistory(studentId: string): Promise<DecisionEvent[]>;
  getAuditLog(filters?: AuditFilters): Promise<AuditEvent[]>;

  // Children & Classes
  getClasses(actor: Actor): Promise<Class[]>;
  getAllChildren(actor: Actor): Promise<ChildRead[]>;
  getChild(id: string, actor: Actor): Promise<ChildRead | undefined>;
  getGuardians(childId: string, actor: Actor): Promise<Guardian[]>;
  getCollectors(childId: string, actor: Actor): Promise<AuthorisedCollector[]>;
  updateChild(child: ChildRead, actor?: Actor): Promise<PortResult<Child>>;
  upsertGuardian(guardian: Guardian, actor?: Actor): Promise<PortResult<Guardian>>;
  removeGuardian(guardianId: string, actor?: Actor): Promise<PortResult<void>>;
  upsertCollector(collector: AuthorisedCollector, actor?: Actor): Promise<PortResult<AuthorisedCollector>>;
  removeCollector(collectorId: string, actor?: Actor): Promise<PortResult<void>>;
  withdrawChild(childId: string, actor?: Actor): Promise<PortResult<Child>>;

  // Attendance (single owner of arrival/departure times)
  getAttendanceRegister(classId: string, date: string, actor: Actor): Promise<AttendanceRegister>;
  getAttendanceSummary(classId: string, date: string, actor: Actor): Promise<AttendanceSummary>;
  markPresent(childId: string, input: AttendanceMarkPresentInput, actor: Actor): Promise<PortResult<AttendanceRecord>>;
  markAbsent(childId: string, input: AttendanceMarkAbsentInput, actor: Actor): Promise<PortResult<AttendanceRecord>>;
  markRemainingPresent(classId: string, actor: Actor): Promise<PortResult<AttendanceRecord[]>>;
  amendAttendance(recordId: string, input: AttendanceAmendInput, actor: Actor): Promise<PortResult<AttendanceAmendment[]>>;
  getAmendments(recordId: string, actor: Actor): Promise<AttendanceAmendment[]>;
  recordDeparture(childId: string, departedAt: string, actor: Actor): Promise<PortResult<AttendanceRecord>>;
  checkInWithPin(childCode: string, pin: string): Promise<PortResult<AttendanceRecord>>;
  checkInWithQr(cardId: string): Promise<PortResult<AttendanceRecord>>;
  getCheckInMethods(childId: string): Promise<CheckInMethodAvailability[]>;

  // Evidence coverage and review queue (derived reads)
  /** Returns coverage for every child and summary totals in the selected term. */
  getCoverage(term: 3 | 4): Promise<ClassCoverage>;
  /** Returns children with non-ok coverage, ordered by number of gaps then oldest evidence. */
  getNeedsAttention(term: 3 | 4): Promise<CoverageStudent[]>;
  /** Returns the oldest-first review queue and changes-requested reports awaiting teachers. */
  getReviewQueue(): Promise<ReviewQueue>;
}

