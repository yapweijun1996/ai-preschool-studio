import { SEED_SUMMARY, STUDENTS, type Student } from '../data/demo';
import { observationsFor, unverifiedClaims, type ReportState, type State } from './reducer';

export interface StudentSummary {
  student: Student;
  report: ReportState;
  count: number;
  lastObserved?: string;
  unverified: number;
}

export function studentSummary(state: State, id: string): StudentSummary | undefined {
  const student = STUDENTS.find((s) => s.id === id);
  if (!student) return undefined;
  const own = observationsFor(state, id);
  const seed = SEED_SUMMARY[id];
  const count = (seed?.count ?? 0) + own.length;
  const dates = own.map((o) => o.date).concat(seed ? [seed.lastObserved] : []).sort();
  return {
    student,
    report: state.reports[id],
    count,
    lastObserved: dates[dates.length - 1],
    unverified: unverifiedClaims(state, id).length
  };
}

export function allSummaries(state: State): StudentSummary[] {
  return STUDENTS.map((s) => studentSummary(state, s.id)!);
}
