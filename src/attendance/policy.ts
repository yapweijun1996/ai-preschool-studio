/** Attendance policy defaults for the fictional demo school. */
export const ATTENDANCE_TIME_ZONE = 'Asia/Singapore';
export const LATE_CUTOFF_LOCAL_TIME = '08:30';
export const PIN_ATTEMPTS_BEFORE_LOCKOUT = 3;
export const PIN_LOCKOUT_MS = 5 * 60 * 1000;
export const FACE_MATCH_ENABLED = false;

export type CheckInUnavailableReason = 'school-disabled' | 'consent-not-recorded';
