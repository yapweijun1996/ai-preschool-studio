import { STUDENTS, TODAY, type Student } from '../data/demo';
import { CURRENT_FRAMEWORK, DOMAINS, type DomainKey, type Milestone } from '../framework';
import { approvalBlock, readiness, unverifiedClaims, type ApprovalBlock, type Readiness, type State } from '../store/reducer';

export type CoverageStatus = 'missing' | 'thin' | 'stale' | 'ok';

export interface AreaCoverage {
  area: DomainKey;
  count: number;
  latestDate?: string;
  latestMilestone?: Milestone;
  status: CoverageStatus;
}

export interface CoverageStudent {
  student: Student;
  areas: AreaCoverage[];
  attentionAreas: number;
  oldestLatestDate?: string;
}

export interface ClassCoverage {
  students: CoverageStudent[];
  summary: { childrenWithGaps: number; areasMissing: number; areasStale: number };
}

export interface QueuedReport {
  student: Student;
  submittedAt: string;
  daysWaiting: number;
  readiness: Readiness;
  unverifiedClaimCount: number;
  approvalBlock: ApprovalBlock;
}

export interface ReviewQueue {
  inReview: QueuedReport[];
  changesRequested: { student: Student; commentDate?: string }[];
}

const daysBetween = (earlier: string, later: string) =>
  Math.floor((Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / 86_400_000);

/** Derives coverage for one child. Missing precedes thin, which precedes stale, then ok. */
export function coverageFor(state: State, studentId: string, term: 3 | 4): AreaCoverage[] {
  const { minPerArea, staleAfterDays } = CURRENT_FRAMEWORK.coverage;
  return DOMAINS.map(({ key: area }) => {
    const observations = state.observations
      .filter((observation) => observation.studentId === studentId && observation.term === term && observation.domain === area)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const latest = observations[0];
    let status: CoverageStatus;
    if (observations.length === 0) status = 'missing';
    else if (observations.length < minPerArea) status = 'thin';
    else if (daysBetween(latest.date, TODAY) > staleAfterDays) status = 'stale';
    else status = 'ok';
    return {
      area,
      count: observations.length,
      ...(latest ? { latestDate: latest.date, latestMilestone: latest.milestone } : {}),
      status
    };
  });
}

/** Returns the whole class and summary totals for the selected term. */
export function classCoverage(state: State, term: 3 | 4): ClassCoverage {
  const students = STUDENTS.map((student) => {
    const areas = coverageFor(state, student.id, term);
    const dates = areas.flatMap((area) => area.latestDate ? [area.latestDate] : []).sort();
    return {
      student,
      areas,
      attentionAreas: areas.filter((area) => area.status !== 'ok').length,
      ...(dates[0] ? { oldestLatestDate: dates[0] } : {})
    };
  });
  return {
    students,
    summary: {
      childrenWithGaps: students.filter((student) => student.attentionAreas > 0).length,
      areasMissing: students.reduce((count, student) => count + student.areas.filter((area) => area.status === 'missing').length, 0),
      areasStale: students.reduce((count, student) => count + student.areas.filter((area) => area.status === 'stale').length, 0)
    }
  };
}

/** Children with gaps first, then children whose oldest latest evidence is oldest. */
export function needsAttention(state: State, term: 3 | 4): CoverageStudent[] {
  return classCoverage(state, term).students
    .filter((student) => student.attentionAreas > 0)
    .sort((a, b) => b.attentionAreas - a.attentionAreas ||
      (a.oldestLatestDate ?? '').localeCompare(b.oldestLatestDate ?? '') || a.student.name.localeCompare(b.student.name));
}

/** Review items are oldest first; changes-requested reports are returned separately for teachers. */
export function reviewQueue(state: State): ReviewQueue {
  const studentById = new Map(STUDENTS.map((student) => [student.id, student]));
  const inReview = Object.entries(state.reports)
    .filter(([studentId, report]) => report.status === 'review' && !!studentById.get(studentId))
    .map(([studentId, report]) => ({
      student: studentById.get(studentId)!,
      submittedAt: report.submittedAt ?? TODAY,
      daysWaiting: daysBetween(report.submittedAt ?? TODAY, TODAY),
      readiness: readiness(state, studentId),
      unverifiedClaimCount: unverifiedClaims(state, studentId).length,
      approvalBlock: approvalBlock(state, studentId)
    }))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt) || a.student.name.localeCompare(b.student.name));
  const changesRequested = Object.entries(state.reports)
    .filter(([studentId, report]) => report.status === 'changes' && !!studentById.get(studentId))
    .map(([studentId, report]) => ({ student: studentById.get(studentId)!, commentDate: report.comment?.date }))
    .sort((a, b) => (a.commentDate ?? '').localeCompare(b.commentDate ?? '') || a.student.name.localeCompare(b.student.name));
  return { inReview, changesRequested };
}
