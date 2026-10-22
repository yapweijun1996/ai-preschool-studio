import { STUDENTS, type Student } from '../data/demo';
import { DOMAINS, type DomainKey, type Milestone } from '../framework';
import { observationsFor, unverifiedClaims, type ReportState, type State } from './reducer';

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

/**
 * A domain's milestone is the one recorded on its most recent observation in that term;
 * null when the domain has no observation yet. Milestones are never set without evidence.
 */
export function milestonesFor(state: State, id: string, term: 3 | 4 = 4): Milestones {
  const obs = observationsFor(state, id, term);
  const out = {} as Milestones;
  for (const d of DOMAINS) {
    const latest = obs.filter((o) => o.domain === d.key).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
    out[d.key] = latest ? latest.milestone : null;
  }
  return out;
}
