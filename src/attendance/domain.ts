import type { Child } from '../children/domain';
import type { Role } from '../roles';
import {
  ATTENDANCE_TIME_ZONE, FACE_MATCH_ENABLED, LATE_CUTOFF_LOCAL_TIME,
  type CheckInUnavailableReason
} from './policy';

export type AttendanceStatus = 'present' | 'absent';
export type AttendanceMethod = 'staff' | 'pin' | 'qr' | 'face-placeholder';
export type AbsenceReason = 'sick' | 'family' | 'travel' | 'other';
export type AmendmentField = 'status' | 'arrivedAt' | 'departedAt' | 'absenceReason';

export interface AttendanceRecord {
  id: string;
  childId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  arrivedAt?: string;
  departedAt?: string;
  method?: AttendanceMethod;
  absenceReason?: AbsenceReason;
  markedBy: string;
  markedAt: string;
}

export interface AttendanceAmendment {
  id: string;
  recordId: string;
  childId: string;
  date: string;
  field: AmendmentField;
  from?: string;
  to?: string;
  reason: string;
  by: string;
  at: string;
}

export interface CheckInMethodAvailability {
  method: AttendanceMethod;
  available: boolean;
  reason?: CheckInUnavailableReason;
}

/** Fictional-only kiosk credentials used by the local demo adapter. */
export interface DemoCheckInCredential {
  childId: string;
  childCode: string;
  pin: string;
  cardId: string;
}

export interface PinLockoutState { failedAttempts: number; lockedUntil?: string }

export interface AttendanceRow {
  child: Omit<Child, 'notes'>;
  record?: AttendanceRecord;
  late: boolean;
}

export interface AttendanceSummary {
  present: number;
  late: number;
  absent: number;
  notMarked: number;
  absenceReasons: Record<AbsenceReason, number>;
}

export type AttendanceRefusal =
  | 'not-today' | 'already-marked' | 'reason-required' | 'child-withdrawn'
  | 'invalid-time' | 'past-date' | 'not-permitted' | 'unknown-child'
  | 'not-present' | 'already-departed' | 'pin-invalid' | 'pin-locked'
  | 'unknown-card';

function dateTimeParts(instant: string, timeZone = ATTENDANCE_TIME_ZONE): Record<string, string> | undefined {
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) return undefined;
  const values = new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(values.map(({ type, value }) => [type, value]));
}

/** Returns an instant's calendar date in the supplied IANA zone, independent of host TZ. */
export function localDate(instant: string, timeZone = ATTENDANCE_TIME_ZONE): string | undefined {
  const parts = dateTimeParts(instant, timeZone);
  if (!parts) return undefined;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Returns HH:mm in the supplied IANA zone, independent of host TZ. */
export function localTime(instant: string, timeZone = ATTENDANCE_TIME_ZONE): string | undefined {
  const parts = dateTimeParts(instant, timeZone);
  return parts ? `${parts.hour}:${parts.minute}` : undefined;
}

/** Formats an attendance instant using the school's Singapore calendar date and time. */
export function formatAttendanceDateTime(
  instant: string,
  formatDate: (date: string) => string,
): string {
  const date = localDate(instant);
  const time = localTime(instant);
  return date && time ? `${formatDate(date)} ${time}` : instant;
}

export function isLate(arrivedAt: string | undefined, cutoff = LATE_CUTOFF_LOCAL_TIME): boolean {
  if (!arrivedAt) return false;
  const parts = dateTimeParts(arrivedAt);
  if (!parts) return false;
  const millis = String(new Date(arrivedAt).getMilliseconds()).padStart(3, '0');
  return `${parts.hour}:${parts.minute}:${parts.second}.${millis}` > `${cutoff}:00.000`;
}

export function validateRecord(
  value: Pick<AttendanceRecord, 'status' | 'arrivedAt' | 'departedAt' | 'absenceReason'> & Partial<Pick<AttendanceRecord, 'date'>>,
  nowIso: string
): AttendanceRefusal | undefined {
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(nowMs)) return 'invalid-time';
  if (value.status === 'absent') {
    if (value.arrivedAt || value.departedAt) return 'invalid-time';
    if (!value.absenceReason) return 'reason-required';
    if (!(['sick', 'family', 'travel', 'other'] as string[]).includes(value.absenceReason)) return 'invalid-time';
    return undefined;
  }
  if (!value.arrivedAt || !Number.isFinite(Date.parse(value.arrivedAt))) return 'invalid-time';
  const arrived = Date.parse(value.arrivedAt);
  if (arrived > nowMs) return 'invalid-time';
  if (value.date && localDate(value.arrivedAt) !== value.date) return 'invalid-time';
  if (value.absenceReason) return 'invalid-time';
  if (value.departedAt) {
    const departed = Date.parse(value.departedAt);
    if (!Number.isFinite(departed) || departed <= arrived || departed > nowMs ||
      (value.date && localDate(value.departedAt) !== value.date)) return 'invalid-time';
  }
  return undefined;
}

export function canMark(input: {
  child: Pick<Child, 'id' | 'classId' | 'status'> | undefined;
  classId: string;
  date: string;
  nowIso: string;
  existing?: AttendanceRecord;
}): AttendanceRefusal | undefined {
  if (!input.child) return 'unknown-child';
  if (input.child.status !== 'active') return 'child-withdrawn';
  if (input.child.classId !== input.classId) return 'not-permitted';
  const today = localDate(input.nowIso);
  if (!today || input.date !== today) return 'not-today';
  if (input.date > today) return 'not-today';
  if (input.existing) return 'already-marked';
  return undefined;
}

export function validateAmendmentReason(reason: string): AttendanceRefusal | undefined {
  const length = reason.trim().length;
  return length < 5 || length > 200 ? 'reason-required' : undefined;
}

export function validateAmendmentValue(field: AmendmentField, to: string | undefined, record: AttendanceRecord, nowIso: string, absenceReason?: AbsenceReason): AttendanceRefusal | undefined {
  if (field === 'status' && to !== 'present' && to !== 'absent') return 'invalid-time';
  if (field === 'status' && to === 'absent' && !absenceReason) return 'reason-required';
  if (field === 'status' && to === 'absent' && !(['sick', 'family', 'travel', 'other'] as string[]).includes(absenceReason!)) return 'invalid-time';
  if (field === 'absenceReason' && to !== undefined && !(['sick', 'family', 'travel', 'other'] as string[]).includes(to)) return 'invalid-time';
  if ((field === 'arrivedAt' || field === 'departedAt') && to !== undefined) {
    if (!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(to) || !Number.isFinite(Date.parse(to)) || localDate(to) !== record.date) return 'invalid-time';
  }
  const amended = { ...record, [field]: to } as AttendanceRecord;
  if (field === 'status' && to === 'absent') { delete amended.arrivedAt; delete amended.departedAt; amended.absenceReason = absenceReason; }
  if (field === 'status' && to === 'present') { delete amended.absenceReason; amended.arrivedAt ??= record.markedAt; amended.method ??= 'staff'; }
  if (field === 'arrivedAt' && to === undefined) return 'invalid-time';
  if (field === 'absenceReason' && amended.status === 'absent' && to === undefined) return 'reason-required';
  if (amended.status === 'absent' && !amended.absenceReason) return 'reason-required';
  return validateRecord(amended, nowIso);
}

export function canAmend(input: {
  role: Role;
  date: string;
  today: string;
  actorClassIds?: readonly string[];
  recordClassId: string;
}): AttendanceRefusal | undefined {
  if (input.role === 'admin') return undefined;
  if (input.role !== 'teacher') return 'not-permitted';
  if (input.date !== input.today) return 'past-date';
  return input.actorClassIds?.includes(input.recordClassId) ? undefined : 'not-permitted';
}

export function dailySummary(rows: readonly AttendanceRow[]): AttendanceSummary {
  const summary: AttendanceSummary = {
    present: 0, late: 0, absent: 0, notMarked: 0,
    absenceReasons: { sick: 0, family: 0, travel: 0, other: 0 }
  };
  for (const row of rows) {
    if (!row.record) summary.notMarked += 1;
    else if (row.record.status === 'absent') {
      summary.absent += 1;
      if (row.record.absenceReason) summary.absenceReasons[row.record.absenceReason] += 1;
    } else {
      summary.present += 1;
      if (row.late) summary.late += 1;
    }
  }
  return summary;
}

export function checkInMethods(consentRecorded: boolean): CheckInMethodAvailability[] {
  return [
    { method: 'staff', available: true },
    { method: 'pin', available: true },
    { method: 'qr', available: true },
    {
      method: 'face-placeholder',
      available: FACE_MATCH_ENABLED && consentRecorded,
      ...(!consentRecorded ? { reason: 'consent-not-recorded' as const } :
        !FACE_MATCH_ENABLED ? { reason: 'school-disabled' as const } : {})
    }
  ];
}

export function dateInAttendanceZone(nowIso: string): string {
  return localDate(nowIso) ?? '';
}
