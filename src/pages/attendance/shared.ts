import { useEffect, useState } from 'react';
import type { AbsenceReason, AttendanceRow, AttendanceSummary } from '../../attendance/domain';
import { TODAY } from '../../data/demo';
import type { PortRefusal } from '../../data/port';
import type { TKey } from '../../i18n';
import { useDataPort, usePortfolio } from '../../store/PortfolioContext';
import { useRole } from '../../roles/RoleContext';
import { demoRole } from '../../roles';
import { localTime } from '../../attendance/domain';
import { now } from '../../utils/clock';
import '../../styles/attendance.css';

export type KioskMethod = 'pin' | 'qr' | 'face';
export const CLASS_ID = 'k2-sunflower-2026';
export type Filter = 'all' | 'notMarked' | 'present' | 'late' | 'absent';
export type Dialog =
  | { kind: 'absence'; row: AttendanceRow }
  | { kind: 'bulk'; count: number; time: string }
  | { kind: 'amend'; row: AttendanceRow }
  | null;
export const REFUSAL_KEYS: Record<PortRefusal, TKey> = {
  'unknown-student': 'pages.attendance.refusalUnknownStudent',
  'wrong-child-observation': 'pages.attendance.refusalWrongChildObservation',
  'date-outside-period': 'pages.attendance.refusalDateOutsidePeriod',
  'report-locked': 'pages.attendance.refusalReportLocked',
  'report-not-editable': 'pages.attendance.refusalReportNotEditable',
  'not-ready': 'pages.attendance.refusalNotReady',
  'unverified-claims': 'pages.attendance.refusalUnverifiedClaims',
  'invalid-target': 'pages.attendance.refusalInvalidTarget',
  'no-observations': 'pages.attendance.refusalNoObservations',
  'not-approved': 'pages.attendance.refusalNotApproved',
  'reason-required': 'pages.attendance.refusalReasonRequired',
  'unknown-child': 'pages.attendance.refusalUnknownChild',
  'invalid-child': 'pages.attendance.refusalInvalidChild',
  'unknown-guardian': 'pages.attendance.refusalUnknownGuardian',
  'invalid-guardian': 'pages.attendance.refusalInvalidGuardian',
  'primary-guardian-required': 'pages.attendance.refusalPrimaryGuardianRequired',
  'unknown-collector': 'pages.attendance.refusalUnknownCollector',
  'invalid-collector': 'pages.attendance.refusalInvalidCollector',
  'report-in-review': 'pages.attendance.refusalReportInReview',
  'record-child-mismatch': 'pages.attendance.refusalRecordChildMismatch',
  'status-change-not-allowed': 'pages.attendance.refusalStatusChangeNotAllowed',
  'not-today': 'pages.attendance.refusalNotToday',
  'already-marked': 'pages.attendance.refusalAlreadyMarked',
  'child-withdrawn': 'pages.attendance.refusalChildWithdrawn',
  'invalid-time': 'pages.attendance.refusalInvalidTime',
  'past-date': 'pages.attendance.refusalPastDate',
  'not-permitted': 'pages.attendance.refusalNotPermitted',
  'not-present': 'pages.attendance.refusalNotPresent',
  'already-departed': 'pages.attendance.refusalAlreadyDeparted',
  'pin-invalid': 'pages.attendance.refusalPinInvalid',
  'pin-locked': 'pages.attendance.refusalPinLocked',
  'consent-not-recorded': 'pages.attendance.refusalConsentNotRecorded',
  'unknown-card': 'pages.attendance.refusalUnknownCard',
  'unknown-record': 'pages.attendance.refusalUnknownRecord',
};
export const REASON_KEYS: Record<AbsenceReason, TKey> = {
  sick: 'pages.attendance.reasonSick',
  family: 'pages.attendance.reasonFamily',
  travel: 'pages.attendance.reasonTravel',
  other: 'pages.attendance.reasonOther',
};
export const FILTERS: Filter[] = ['all', 'notMarked', 'present', 'late', 'absent'];
export const FILTER_LABELS: Record<Filter, TKey> = {
  all: 'pages.attendance.all',
  notMarked: 'pages.attendance.filterNotMarked',
  present: 'pages.attendance.filterPresent',
  late: 'pages.attendance.filterLate',
  absent: 'pages.attendance.filterAbsent',
};
export const KIOSK_TAB_LABELS: Record<KioskMethod, TKey> = {
  pin: 'pages.attendance.pinTab',
  qr: 'pages.attendance.qrTab',
  face: 'pages.attendance.faceUnavailableTab',
};

export function actor(role: ReturnType<typeof useRole>['role']) {
  return { role, name: demoRole(role).name };
}
export function summary(rows: AttendanceRow[]): AttendanceSummary {
  const value: AttendanceSummary = {
    present: 0,
    late: 0,
    absent: 0,
    notMarked: 0,
    absenceReasons: { sick: 0, family: 0, travel: 0, other: 0 },
  };
  rows.forEach((row) => {
    if (!row.record) value.notMarked++;
    else if (row.record.status === 'absent') {
      value.absent++;
      if (row.record.absenceReason) value.absenceReasons[row.record.absenceReason]++;
    } else {
      value.present++;
      if (row.late) value.late++;
    }
  });
  return value;
}

export function useRegister(date = TODAY) {
  const { state } = usePortfolio();
  const port = useDataPort();
  const role = useRole();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setLoadFailed(false);
    void port.getAttendanceRegister(CLASS_ID, date, actor(role.role)).then(
      (register) => {
        if (live) {
          setRows(register.rows);
          setLoading(false);
          setLoadFailed(false);
        }
      },
      () => {
        if (live) {
          setLoading(false);
          setLoadFailed(true);
        }
      },
    );
    return () => {
      live = false;
    };
  }, [port, date, role.role, state, retryCount]);
  return {
    rows,
    loading,
    loadFailed,
    retry: () => setRetryCount((count) => count + 1),
    port,
    role,
    refresh: () =>
      port.getAttendanceRegister(CLASS_ID, date, actor(role.role)).then((r) => setRows(r.rows)),
  };
}

export function timeValue(dateTime?: string) {
  return dateTime ? (localTime(dateTime) ?? '') : (localTime(now()) ?? '08:00');
}
export function atTime(value: string, date = TODAY) {
  return `${date}T${value}:00+08:00`;
}
export function amendmentActorName(actorId: string, t: (key: TKey) => string) {
  if (actorId === 'admin-wong') return 'Ms. Wong';
  if (actorId === 'teacher-lim') return 'Ms. Lim';
  if (actorId === 'check-in-kiosk') return t('pages.attendance.actorKiosk');
  return actorId;
}
export function focusAttendanceChildWhenReady(childId: string, attempts = 30) {
  window.setTimeout(() => {
    const heading = document.querySelector<HTMLElement>(`[data-attendance-child="${childId}"]`);
    const list = heading?.closest<HTMLElement>('.attendance-list');
    if (heading && list?.getAttribute('aria-busy') === 'false') heading.focus();
    else if (attempts > 0) focusAttendanceChildWhenReady(childId, attempts - 1);
  }, 16);
}

