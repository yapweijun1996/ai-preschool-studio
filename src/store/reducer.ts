// Pure portfolio state + transitions. Kept free of React so it can be unit tested.
import {
  ARIA_PARAGRAPHS,
  ARIA_REFLECTION,
  OBSERVATIONS,
  REVIEWER,
  STUDENTS,
  type Observation,
  type Paragraph,
  type ReportStatus,
  type Sentence
} from '../data/demo';
import type { Suggestion } from '../services/mockProvider';

export interface ReportState {
  status: ReportStatus;
  hadChanges: boolean;
  comment?: { by: string; date: string; text: string };
  approvedAt?: string;
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
  | { type: 'linkSource'; studentId: string; sentenceId: string; obsId: string }
  | { type: 'removeSentence'; studentId: string; sentenceId: string }
  | { type: 'applySuggestion'; studentId: string; suggestion: Suggestion }
  | { type: 'restoreParagraph'; studentId: string; paragraph: Paragraph }
  | { type: 'setReflection'; studentId: string; text: string }
  | { type: 'submitForReview'; studentId: string }
  | { type: 'requestChanges'; studentId: string; text: string; date: string }
  | { type: 'approve'; studentId: string; at: string }
  | { type: 'setSim'; key: keyof State['sim']; value: boolean }
  | { type: 'reset' };

export function initialState(): State {
  const reports: Record<string, ReportState> = {};
  for (const s of STUDENTS) reports[s.id] = { status: s.reportStatus, hadChanges: s.reportStatus === 'changes' };
  reports.rayan.comment = { by: REVIEWER, date: '2026-10-20', text: 'Mathematics 数学 needs a second observation before we can say “Consistently demonstrated”.' };
  return {
    observations: OBSERVATIONS,
    paragraphs: { aria: ARIA_PARAGRAPHS },
    reflections: { aria: ARIA_REFLECTION },
    reports,
    sim: { aiDown: false, saveFail: false },
    nextObsNumber: 158
  };
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

function setReport(state: State, studentId: string, patch: Partial<ReportState>): State {
  return { ...state, reports: { ...state.reports, [studentId]: { ...state.reports[studentId], ...patch } } };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'addObservation': {
      const id = `OBS-${String(state.nextObsNumber).padStart(4, '0')}`;
      return { ...state, observations: [{ ...action.obs, id }, ...state.observations], nextObsNumber: state.nextObsNumber + 1 };
    }
    case 'linkSource':
      return mapSentences(state, action.studentId, (s) =>
        s.id === action.sentenceId && !s.sources.includes(action.obsId) ? { ...s, sources: [...s.sources, action.obsId] } : s
      );
    case 'removeSentence':
      return mapSentences(state, action.studentId, (s) => (s.id === action.sentenceId ? null : s));
    case 'applySuggestion': {
      const paras = state.paragraphs[action.studentId] ?? [];
      const next = paras.map((p) => (p.id === action.suggestion.paragraphId ? { ...p, sentences: action.suggestion.after } : p));
      return { ...state, paragraphs: { ...state.paragraphs, [action.studentId]: next } };
    }
    case 'restoreParagraph': {
      const paras = state.paragraphs[action.studentId] ?? [];
      const next = paras.map((p) => (p.id === action.paragraph.id ? action.paragraph : p));
      return { ...state, paragraphs: { ...state.paragraphs, [action.studentId]: next } };
    }
    case 'setReflection':
      return { ...state, reflections: { ...state.reflections, [action.studentId]: action.text } };
    case 'submitForReview': {
      const r = state.reports[action.studentId];
      if (!r || r.status === 'approved' || r.status === 'review') return state;
      return setReport(state, action.studentId, { status: 'review' });
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
      return setReport(state, action.studentId, { status: 'approved', approvedAt: action.at });
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

export type ApprovalBlock = { reason: 'status'; status: ReportStatus } | { reason: 'claims'; count: number } | null;

export function approvalBlock(state: State, studentId: string): ApprovalBlock {
  const report = state.reports[studentId];
  if (!report || report.status !== 'review') return { reason: 'status', status: report?.status ?? 'notStarted' };
  const count = unverifiedClaims(state, studentId).length;
  return count > 0 ? { reason: 'claims', count } : null;
}

export function canApprove(state: State, studentId: string): boolean {
  return approvalBlock(state, studentId) === null;
}

export function observationsFor(state: State, studentId: string, term: 3 | 4 = 4): Observation[] {
  return state.observations.filter((o) => o.studentId === studentId && o.term === term);
}
