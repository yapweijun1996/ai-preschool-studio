import type { Observation, Paragraph } from './demo';
import type { Framework, DomainKey, Milestone, ReportingPeriod } from '../framework';
import type { ApprovalBlock, Readiness, UnverifiedClaim } from '../store/reducer';
import type { StudentSummary } from '../store/selectors';
import type { Suggestion } from '../services/mockProvider';

export type PortRefusal =
  | 'unknown-student'
  | 'wrong-child-observation'
  | 'date-outside-period'
  | 'report-locked'
  | 'report-not-editable'
  | 'not-ready'
  | 'unverified-claims'
  | 'invalid-target'
  | 'no-observations';

export type PortResult<T> = { ok: true; value: T } | { ok: false; reason: PortRefusal };
export type Draft = { paragraphs: Paragraph[]; reflection: string };
export type ObservationInput = Omit<Observation, 'id' | 'term'>;

export interface DataPort {
  // Observations
  getStudentSummary(studentId: string): Promise<StudentSummary | undefined>;
  getCurrentFramework(): Promise<Framework>;
  getPeriod(date: string): Promise<ReportingPeriod | undefined>;
  /** Rejects dates outside all configured reporting periods. */
  addObservation(input: ObservationInput): Promise<PortResult<Observation>>;

  // Learning progress
  getAllSummaries(): Promise<StudentSummary[]>;
  getMilestones(studentId: string, term?: 3 | 4): Promise<Record<DomainKey, Milestone | null>>;
  getObservations(studentId: string, term?: 3 | 4): Promise<Observation[]>;

  // Portfolio studio
  getReadiness(studentId: string): Promise<Readiness>;
  getUnverifiedClaims(studentId: string): Promise<UnverifiedClaim[]>;
  getDraft(studentId: string): Promise<Draft>;
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
  getApprovalBlock(studentId: string): Promise<ApprovalBlock>;
  /** Requests changes only for reports currently in review. */
  requestChanges(studentId: string, text: string, date: string): Promise<PortResult<void>>;
  /** Approves only review reports with complete readiness and verified claims. */
  approve(studentId: string, approvedBy: string, at: string): Promise<PortResult<{ approvedBy: string; at: string }>>;
}

