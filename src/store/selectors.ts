import { STUDENTS, type Student } from '../data/demo';
import type { DomainKey, Milestone } from '../framework';
import { milestonesFrom, observationsFor, unverifiedClaims, type ReportState, type State } from './reducer';

export interface StudentSummary {
  student: Student;
  report: ReportState;
  /** Term 4 observations. */
  count: number;
  /** Most recent observation date (any term). */
  lastObserved?: string;
  unverified: number;
}

export function studentSummary(state: State, id: string): StudentSummary | undefined {
  const student = STUDENTS.find((s) => s.id === id);
  if (!student) return undefined;
  const all = state.observations.filter((o) => o.studentId === id);
  const dates = all.map((o) => o.date).sort();
  return {
    student,
    report: state.reports[id],
    count: observationsFor(state, id, 4).length,
    lastObserved: dates[dates.length - 1],
    unverified: unverifiedClaims(state, id).length
  };
}

export function allSummaries(state: State): StudentSummary[] {
  return STUDENTS.map((s) => studentSummary(state, s.id)!);
}

export type Milestones = Record<DomainKey, Milestone | null>;

/** Live Term 3 / Term 4 milestones for a child (see milestonesFrom). */
export function milestonesFor(state: State, id: string, term: 3 | 4 = 4): Milestones {
  return milestonesFrom(state.observations, id, term);
}
