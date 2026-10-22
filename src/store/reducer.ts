// Pure portfolio state + transitions. Kept free of React so it can be unit tested.
import { ARIA_PARAGRAPHS, ARIA_REFLECTION, NEXT_OBS_NUMBER, OBSERVATIONS, REVIEWER, STUDENTS, TODAY, draftFromObservations, seededDrafts, type Observation, type Paragraph, type ReportStatus, type Sentence } from '../data/demo';
import { CURRENT_FRAMEWORK, DOMAINS, termOf, type DomainKey, type Milestone } from '../framework';
import type { Suggestion } from '../services/mockProvider';

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
}

export interface State {
  observations: Observation[];
  paragraphs: Record<string, Paragraph[]>;
  reflections: Record<string, string>;
  reports: Record<string, ReportState>;
  sim: { aiDown: boolean; saveFail: boolean };
  nextObsNumber: number;
}

export type Action =
  | { type: 'addObservation'; obs: Omit<Observation, 'id'> }
  | { type: 'startDraft'; studentId: string }
  | { type: 'fillMissingDomains'; studentId: string }
  | { type: 'linkSource'; studentId: string; sentenceId: string; obsId: string }
  | { type: 'removeSentence'; studentId: string; sentenceId: string }
  | { type: 'applySuggestion'; studentId: string; suggestion: Suggestion }
  | { type: 'restoreParagraph'; studentId: string; paragraph: Paragraph }
  | { type: 'setReflection'; studentId: string; text: string }
  | { type: 'submitForReview'; studentId: string; submittedAt: string }
  | { type: 'requestChanges'; studentId: string; text: string; date: string }
  | { type: 'approve'; studentId: string; at: string }
  | { type: 'setSim'; key: keyof State['sim']; value: boolean }
  | { type: 'reset' };

export function initialState(): State {
  const reports: Record<string, ReportState> = {};
  for (const s of STUDENTS)
    reports[s.id] = {
      status: s.reportStatus,
      hadChanges: s.reportStatus === 'changes',
      ...(s.reportStatus === 'review' ? { submittedAt: seededSubmissionDate(s.id) } : {}),
      ...(s.reportStatus === 'approved' ? { frameworkVersion: CURRENT_FRAMEWORK.version, milestones: milestonesFrom(OBSERVATIONS, s.id, 4) } : {})
    };
  reports.rayan.comment = { by: REVIEWER, date: '2026-10-20', text: 'Mathematics 数学 needs a second observation before we can say “Consistently demonstrated”.' };
  const seeded = seededDrafts();
  return {
    observations: OBSERVATIONS,
    paragraphs: { ...seeded.paragraphs, aria: ARIA_PARAGRAPHS },
    reflections: { ...seeded.reflections, aria: ARIA_REFLECTION },
    reports,
    sim: { aiDown: false, saveFail: false },
    nextObsNumber: NEXT_OBS_NUMBER
  };
}

function seededSubmissionDate(studentId: string): string {
  const dates: Record<string, string> = {
    ethan: '2026-10-16',
    daniel: '2026-10-18',
    priya: '2026-10-20',
    weiming: '2026-10-21'
  };
  return dates[studentId] ?? TODAY;
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

const ownsObservation = (state: State, studentId: string, obsId: string) => state.observations.some((o) => o.id === obsId && o.studentId === studentId);
/** Approved reports are frozen: no content action may change them. */
const contentLocked = (state: State, studentId: string) => state.reports[studentId]?.status === 'approved';
/** Wording is also paused while in review; linking evidence stays open so the reviewer can clear a blocked approval. */
const editLocked = (state: State, studentId: string) => contentLocked(state, studentId) || state.reports[studentId]?.status === 'review';

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
      return { ...state, observations: [obs, ...state.observations], nextObsNumber: state.nextObsNumber + 1 };
    }
    case 'fillMissingDomains': {
      const student = STUDENTS.find((x) => x.id === action.studentId);
      const status = state.reports[action.studentId]?.status;
      if (!student || (status !== 'draft' && status !== 'changes')) return state;
      const paras = state.paragraphs[action.studentId] ?? [];
      const written = new Set(paras.filter((p) => p.sentences.length > 0).map((p) => p.domain));
      const fresh = draftFromObservations(student, observationsFor(state, action.studentId)).filter((p) => !written.has(p.domain));
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
      if (!student || !report || report.status !== 'notStarted' || (state.paragraphs[action.studentId]?.length ?? 0) > 0) return state;
      const paragraphs = draftFromObservations(student, observationsFor(state, action.studentId));
      if (paragraphs.length === 0) return state;
      return setReport({ ...state, paragraphs: { ...state.paragraphs, [action.studentId]: paragraphs } }, action.studentId, { status: 'draft' });
    }
    case 'linkSource':
      if (contentLocked(state, action.studentId) || !ownsObservation(state, action.studentId, action.obsId)) return state;
      return mapSentences(state, action.studentId, (s) =>
        s.id === action.sentenceId && !s.sources.includes(action.obsId) ? { ...s, sources: [...s.sources, action.obsId] } : s
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
      const next = paras.map((p) => (p.id === action.suggestion.paragraphId ? { ...p, sentences: action.suggestion.after } : p));
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
      return setReport(state, action.studentId, { status: 'review', submittedAt: action.submittedAt });
    }
    case 'requestChanges': {
      if (state.reports[action.studentId]?.status !== 'review') return state;
      return setReport(state, action.studentId, {
        status: 'changes',
        hadChanges: true,
        comment: { by: REVIEWER, date: action.date, text: action.text }
      });
    }
    case 'approve': {
      // Approval is blocked while any claim lacks evidence.
      if (!canApprove(state, action.studentId)) return state;
      return setReport(state, action.studentId, {
        status: 'approved',
        approvedAt: action.at,
        frameworkVersion: CURRENT_FRAMEWORK.version,
        milestones: milestonesFrom(state.observations, action.studentId, 4)
      });
    }
    case 'setSim':
      return { ...state, sim: { ...state.sim, [action.key]: action.value } };
    case 'reset':
      return initialState();
  }
}

export interface UnverifiedClaim {
  paragraphId: string;
  sentence: Sentence;
}

export function unverifiedClaims(state: State, studentId: string): UnverifiedClaim[] {
  const paras = state.paragraphs[studentId] ?? [];
  return paras.flatMap((p) => p.sentences.filter((s) => s.sources.length === 0).map((sentence) => ({ paragraphId: p.id, sentence })));
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
  return { domainsWritten: written.size, domainsTotal, sentences, unverified, hasReflection, canSubmit, canApprove: canSubmit && unverified === 0 };
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
export function milestonesFrom(observations: Observation[], studentId: string, term: 3 | 4): Record<DomainKey, Milestone | null> {
  const obs = observations.filter((o) => o.studentId === studentId && o.term === term);
  const out = {} as Record<DomainKey, Milestone | null>;
  for (const d of DOMAINS) {
    const latest = obs.filter((o) => o.domain === d.key).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
    out[d.key] = latest ? latest.milestone : null;
  }
  return out;
}

export function observationsFor(state: State, studentId: string, term: 3 | 4 = 4): Observation[] {
  return state.observations.filter((o) => o.studentId === studentId && o.term === term);
}
