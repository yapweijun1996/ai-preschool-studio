import { describe, expect, it } from 'vitest';
import { DEMO_CLASSES, DEMO_CHILDREN } from '../src/children/demo';
import {
  canAmend, canMark, checkInMethods, dailySummary, dateInAttendanceZone, isLate,
  localDate, localTime, validateAmendmentReason, validateAmendmentValue, validateRecord,
  type AttendanceRow
} from '../src/attendance/domain';
import { DEMO_ATTENDANCE_RECORDS } from '../src/attendance/demo';
import { createDemoAdapter } from '../src/data/demoAdapter';
import type { DataPort } from '../src/data/port';
import { initialState, reducer, type State } from '../src/store/reducer';
import { TODAY } from '../src/data/demo';
import { demoNow } from '../src/utils/clock';

const schoolClass = DEMO_CLASSES[0];
const teacher = { role: 'teacher' as const, name: 'Ms. Lim' };
const admin = { role: 'admin' as const, name: 'Ms. Wong' };
const reviewer = { role: 'reviewer' as const, name: 'Mr. Tan' };
const parent = { role: 'parent' as const, name: 'Fictional Parent' };
const iso = (date: string, time: string) => `${date}T${time}:00+08:00`;

function adapterFrom(seed = initialState(), clock: () => Date = () => new Date('2026-10-22T09:00:00+08:00')): { port: DataPort; getState: () => State } {
  let state = seed;
  const port = createDemoAdapter(() => state, (action) => { state = reducer(state, action); }, clock);
  return { port, getState: () => state };
}

describe('attendance pure domain', () => {
  it('anchors demoNow to the seeded business date and Singapore wall-clock time', () => {
    expect(demoNow(() => new Date('2027-01-01T00:15:30.123Z')).toISOString()).toBe('2026-10-22T16:15:30.123Z');
  });
  it('derives local dates, times and late status in Singapore independent of host timezone', () => {
    expect(localDate('2026-10-22T16:45:00.000Z')).toBe('2026-10-23');
    expect(localTime('2026-10-22T16:45:00.000Z')).toBe('00:45');
    expect(isLate('2026-10-23T00:29:00.000Z')).toBe(false);
    expect(isLate('2026-10-23T00:30:00.000Z')).toBe(false);
    expect(isLate('2026-10-23T00:30:00.001Z')).toBe(true);
    expect(isLate('2026-10-23T00:30:59.000Z')).toBe(true);
    expect(isLate('2026-10-23T00:31:00.000Z')).toBe(true);
  });

  it('permits only a first mark for an active enrolled child today', () => {
    const child = DEMO_CHILDREN[Object.keys(DEMO_CHILDREN)[0]];
    const nowIso = '2026-10-23T02:00:00.000Z';
    expect(canMark({ child, classId: child.classId, date: '2026-10-23', nowIso })).toBeUndefined();
    expect(canMark({ child, classId: child.classId, date: '2026-10-24', nowIso })).toBe('not-today');
    expect(canMark({ child, classId: child.classId, date: '2026-10-22', nowIso })).toBe('not-today');
    expect(canMark({ child: { ...child, status: 'withdrawn' }, classId: child.classId, date: '2026-10-23', nowIso })).toBe('child-withdrawn');
    expect(canMark({ child, classId: 'other-class', date: '2026-10-23', nowIso })).toBe('not-permitted');
    const existing = DEMO_ATTENDANCE_RECORDS[0];
    expect(canMark({ child, classId: child.classId, date: '2026-10-23', nowIso, existing })).toBe('already-marked');
  });

  it('validates absent and present time invariants', () => {
    const nowIso = '2026-10-23T02:00:00.000Z';
    expect(validateRecord({ status: 'absent' }, nowIso)).toBeUndefined();
    expect(validateRecord({ status: 'absent', arrivedAt: nowIso }, nowIso)).toBe('invalid-time');
    expect(validateRecord({ status: 'present' }, nowIso)).toBe('invalid-time');
    expect(validateRecord({ status: 'present', arrivedAt: '2026-10-23T03:00:00.000Z' }, nowIso)).toBe('invalid-time');
    expect(validateRecord({ status: 'present', arrivedAt: '2026-10-23T01:00:00.000Z', departedAt: '2026-10-23T00:59:00.000Z' }, nowIso)).toBe('invalid-time');
    expect(validateRecord({ status: 'present', arrivedAt: '2026-10-23T01:00:00.000Z', departedAt: '2026-10-23T02:01:00.000Z' }, nowIso)).toBe('invalid-time');
    expect(validateRecord({ status: 'present', date: '2026-10-22', arrivedAt: '2026-10-23T01:00:00.000Z' }, nowIso)).toBe('invalid-time');
  });

  it('restricts amendment reasons and teacher date/class access', () => {
    expect(validateAmendmentReason('   ')).toBe('reason-required');
    expect(validateAmendmentReason('four')).toBe('reason-required');
    expect(validateAmendmentReason('Fictional correction')).toBeUndefined();
    expect(validateAmendmentReason('x'.repeat(201))).toBe('reason-required');
    expect(canAmend({ role: 'teacher', date: '2026-10-23', today: '2026-10-23', actorClassIds: [schoolClass.id], recordClassId: schoolClass.id })).toBeUndefined();
    expect(canAmend({ role: 'teacher', date: '2026-10-22', today: '2026-10-23', actorClassIds: [schoolClass.id], recordClassId: schoolClass.id })).toBe('past-date');
    expect(canAmend({ role: 'teacher', date: '2026-10-23', today: '2026-10-23', actorClassIds: [], recordClassId: schoolClass.id })).toBe('not-permitted');
    expect(canAmend({ role: 'reviewer', date: '2026-10-23', today: '2026-10-23', recordClassId: schoolClass.id })).toBe('not-permitted');
    expect(canAmend({ role: 'admin', date: '2020-01-01', today: '2026-10-23', recordClassId: schoolClass.id })).toBeUndefined();
  });

  it('validates amendment enum values and timestamp date/order', () => {
    const record = { ...DEMO_ATTENDANCE_RECORDS.find((item) => item.date === TODAY && item.status === 'present')! };
    expect(validateAmendmentValue('status', 'banana', record, '2026-10-22T10:00:00+08:00')).toBe('invalid-time');
    expect(validateAmendmentValue('absenceReason', 'xyz', record, '2026-10-22T10:00:00+08:00')).toBe('invalid-time');
    expect(validateAmendmentValue('arrivedAt', '2026-10-21T08:00:00+08:00', record, '2026-10-22T10:00:00+08:00')).toBe('invalid-time');
  });

  it('keeps face method consent-gated and disabled by school policy', () => {
    expect(checkInMethods(false).find((item) => item.method === 'face-placeholder')).toMatchObject({ available: false, reason: 'consent-not-recorded' });
    expect(checkInMethods(true).find((item) => item.method === 'face-placeholder')).toMatchObject({ available: false, reason: 'school-disabled' });
    expect(checkInMethods(false).filter((item) => item.available).map((item) => item.method)).toEqual(['staff', 'pin', 'qr']);
  });

  it('counts daily present, late, absent, unmarked and absence reasons', () => {
    const rows: AttendanceRow[] = [
      { child: DEMO_CHILDREN.aria, record: { ...DEMO_ATTENDANCE_RECORDS[0], status: 'present' }, late: true },
      { child: DEMO_CHILDREN.daniel, record: { ...DEMO_ATTENDANCE_RECORDS[1], status: 'absent', absenceReason: 'sick' }, late: false },
      { child: DEMO_CHILDREN.ethan, record: { ...DEMO_ATTENDANCE_RECORDS[2], status: 'absent', absenceReason: 'sick' }, late: false },
      { child: DEMO_CHILDREN.priya, late: false }
    ];
    expect(dailySummary(rows)).toEqual({
      present: 1, late: 1, absent: 2, notMarked: 1,
      absenceReasons: { sick: 2, family: 0, travel: 0, other: 0 }
    });
  });
});

describe('attendance demo adapter', () => {
  it('seeds ten school days, two amendments, and today with 12 present, one absent and seven unmarked', async () => {
    expect(new Set(DEMO_ATTENDANCE_RECORDS.map((record) => record.date)).size).toBe(11);
    expect(DEMO_ATTENDANCE_RECORDS).toHaveLength(213);
    const { port } = adapterFrom();
    const register = await port.getAttendanceRegister(schoolClass.id, TODAY, teacher);
    expect(register.rows).toHaveLength(20);
    expect(await port.getAttendanceSummary(schoolClass.id, TODAY, teacher)).toMatchObject({
      present: 12, late: 2, absent: 1, notMarked: 7,
      absenceReasons: { family: 1 }
    });
    expect((await port.getAmendments(DEMO_ATTENDANCE_RECORDS[2 * 20 + 2].id, teacher))).toHaveLength(1);
    expect((await port.getAmendments(DEMO_ATTENDANCE_RECORDS[5 * 20 + 16].id, teacher))).toHaveLength(1);
  });

  it('excludes withdrawn children today and preserves their history only when a record exists', async () => {
    const state = initialState();
    const withdrawnId = Object.keys(state.children)[0];
    state.children = { ...state.children, [withdrawnId]: { ...state.children[withdrawnId], status: 'withdrawn' } };
    const { port } = adapterFrom(state);
    const today = dateInAttendanceZone(new Date().toISOString());
    expect((await port.getAttendanceRegister(schoolClass.id, today, teacher)).rows.some((row) => row.child.id === withdrawnId)).toBe(false);
    const historic = await port.getAttendanceRegister(schoolClass.id, TODAY, teacher);
    expect(historic.rows.some((row) => row.child.id === withdrawnId)).toBe(true);
  });

  it('refuses teacher past-day amendments and parent/reviewer writes', async () => {
    const { port } = adapterFrom();
    const record = DEMO_ATTENDANCE_RECORDS.find((item) => item.date === TODAY)!;
    expect(await port.amendAttendance(record.id, { field: 'arrivedAt', to: iso(TODAY, '08:01'), reason: 'Fictional correction' }, teacher)).toEqual({ ok: false, reason: 'past-date' });
    expect(await port.markAbsent('aria', { reason: 'sick' }, reviewer)).toEqual({ ok: false, reason: 'not-permitted' });
    expect(await port.markAbsent('aria', { reason: 'sick' }, parent)).toEqual({ ok: false, reason: 'not-permitted' });
  });

  it('requires amendment reasons and supports a reasoned absence-to-present correction', async () => {
    const { port, getState } = adapterFrom();
    const absent = DEMO_ATTENDANCE_RECORDS.find((record) => record.date === TODAY && record.status === 'absent')!;
    expect(await port.amendAttendance(absent.id, { field: 'status', to: 'present', reason: 'no' }, admin)).toEqual({ ok: false, reason: 'reason-required' });
    const result = await port.amendAttendance(absent.id, { field: 'status', to: 'present', reason: 'Fictional register correction' }, admin);
    expect(result.ok).toBe(true);
    expect(getState().attendanceRecords.find((record) => record.id === absent.id)).toMatchObject({
      status: 'present', arrivedAt: absent.markedAt
    });
  });

  it('enforces PIN lockout for three failures and clears it after five minutes', async () => {
    let instant = new Date('2026-10-22T09:00:00+08:00');
    const { port } = adapterFrom(initialState(), () => instant);
    expect(await port.checkInWithPin('FC-1001', '0000')).toEqual({ ok: false, reason: 'pin-invalid' });
    expect(await port.checkInWithPin('FC-1001', '0000')).toEqual({ ok: false, reason: 'pin-invalid' });
    expect(await port.checkInWithPin('FC-1001', '0000')).toEqual({ ok: false, reason: 'pin-locked' });
    instant = new Date('2026-10-22T09:04:59.999+08:00');
    expect(await port.checkInWithPin('FC-1001', '4821')).toEqual({ ok: false, reason: 'pin-locked' });
    instant = new Date('2026-10-22T09:05:00+08:00');
    const unlocked = await port.checkInWithPin('FC-1001', '4821');
    expect(unlocked.ok, JSON.stringify(unlocked)).toBe(true);
    expect(await port.checkInWithPin('missing-code', '4821')).toEqual({ ok: false, reason: 'pin-invalid' });
  });

  it('keeps PINs and amendment reasons out of audit events and refuses duplicate marks', async () => {
    const { port, getState } = adapterFrom();
    const nowIso = new Date().toISOString();
    const currentDate = dateInAttendanceZone(nowIso);
    const childId = Object.keys(DEMO_CHILDREN)[0];
    const firstMark = await port.markPresent(childId, { arrivedAt: new Date(Date.parse(nowIso) - 60_000).toISOString(), method: 'staff' }, teacher);
    expect(firstMark.ok, JSON.stringify(firstMark)).toBe(true);
    if (firstMark.ok) expect(firstMark.value.markedBy).toBe('teacher-lim');
    expect(await port.markPresent(Object.keys(DEMO_CHILDREN)[1], { arrivedAt: nowIso, method: 'face-placeholder' }, teacher)).toEqual({ ok: false, reason: 'consent-not-recorded' });
    expect(await port.markPresent(childId, { arrivedAt: nowIso, method: 'staff' }, teacher)).toEqual({ ok: false, reason: 'already-marked' });

    const record = DEMO_ATTENDANCE_RECORDS.find((item) => item.date === TODAY)!;
    const change = await port.amendAttendance(record.id, { field: 'arrivedAt', to: iso(TODAY, '08:01'), reason: 'Fictional reason private to amendment' }, admin);
    expect(change.ok).toBe(true);
    if (change.ok) expect(change.value.by).toBe('admin-wong');
    const audit = JSON.stringify(getState().auditEvents);
    expect(audit).not.toContain('Fictional reason private to amendment');
    expect(audit).not.toContain('4821');
    expect(getState().auditEvents.at(-1)?.summaryKey).toBe('attendance.amended');
    expect(getState().attendanceRecords.some((item) => item.date === currentDate && item.childId === childId)).toBe(true);
  });

  it('refuses departure for absent or unmarked children and a second departure', async () => {
    const { port } = adapterFrom();
    const absent = DEMO_ATTENDANCE_RECORDS.find((record) => record.date === TODAY && record.status === 'absent')!;
    expect(await port.recordDeparture(absent.childId, iso(TODAY, '17:00'), admin)).toEqual({ ok: false, reason: 'not-present' });
    const childId = Object.keys(DEMO_CHILDREN)[1];
    expect(await port.recordDeparture(childId, new Date().toISOString(), admin)).toEqual({ ok: false, reason: 'not-present' });
    const arrival = new Date(Date.now() - 10 * 60_000).toISOString();
    const marked = await port.markPresent(childId, { arrivedAt: arrival, method: 'staff' }, teacher);
    expect(marked.ok).toBe(true);
    const departedAt = new Date().toISOString();
    expect((await port.recordDeparture(childId, departedAt, admin)).ok).toBe(true);
    expect(await port.recordDeparture(childId, new Date(Date.now() + 60_000).toISOString(), admin)).toEqual({ ok: false, reason: 'already-departed' });
  });

  it('refuses recordDeparture for a past business date so history needs an amendment', async () => {
    const { port } = adapterFrom();
    const childId = Object.keys(DEMO_CHILDREN)[0];
    expect(await port.recordDeparture(childId, iso('2026-10-21', '17:00'), admin)).toEqual({ ok: false, reason: 'past-date' });
  });

  it('reports demo method availability and unknown QR cards', async () => {
    const { port } = adapterFrom();
    expect(await port.getCheckInMethods('aria')).toContainEqual({ method: 'face-placeholder', available: false, reason: 'consent-not-recorded' });
    expect(await port.checkInWithQr('unknown-card')).toEqual({ ok: false, reason: 'unknown-card' });
  });
});
