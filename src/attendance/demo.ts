import { STUDENTS, TODAY } from '../data/demo';
import type { AttendanceAmendment, AttendanceRecord, DemoCheckInCredential } from './domain';

export const DEMO_CHECK_IN_DATA_LABEL = 'Fictional demo check-in data';

function previousSchoolDays(today: string, count: number): string[] {
  const result: string[] = [];
  const cursor = new Date(`${today}T00:00:00.000Z`);
  cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (result.length < count) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) result.unshift(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return result;
}

const asSingaporeInstant = (date: string, hour: number, minute: number): string =>
  `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`;

const records: AttendanceRecord[] = [];
const amendments: AttendanceAmendment[] = [];
let recordNumber = 1;
let amendmentNumber = 1;
const historyDays = previousSchoolDays(TODAY, 10);

historyDays.forEach((date, dayIndex) => {
  STUDENTS.forEach((child, childIndex) => {
    const absent = (childIndex * 5 + dayIndex * 3) % 19 === 0;
    const late = !absent && (childIndex * 7 + dayIndex * 5) % 17 === 0;
    const reason = (['sick', 'family', 'travel', 'other'] as const)[(childIndex + dayIndex) % 4];
    const originalArrival = asSingaporeInstant(date, late ? 8 : 7, late ? 35 + (childIndex % 20) : 45 + (childIndex % 14));
    const record: AttendanceRecord = {
      id: `ATT-${String(recordNumber++).padStart(4, '0')}`,
      childId: child.id,
      classId: 'k2-sunflower-2026',
      date,
      status: absent ? 'absent' : 'present',
      ...(!absent ? { arrivedAt: originalArrival, method: 'staff' as const } : { absenceReason: reason }),
      markedBy: 'teacher-lim',
      markedAt: asSingaporeInstant(date, 8, 40)
    };
    records.push(record);

    // Two fictional corrections demonstrate the immutable amendment trail.
    if (dayIndex === 2 && childIndex === 2) {
      const correctedArrival = asSingaporeInstant(date, 7, 24);
      amendments.push({
        id: `AMEND-${String(amendmentNumber++).padStart(4, '0')}`,
        recordId: record.id, childId: child.id, date, field: 'arrivedAt',
        from: record.arrivedAt, to: correctedArrival,
        reason: 'Fictional correction: paper register showed an earlier arrival.',
        by: 'Ms. Wong', at: asSingaporeInstant(date, 9, 15)
      });
      record.arrivedAt = correctedArrival;
    }
    if (dayIndex === 5 && childIndex === 16) {
      const from = record.absenceReason ?? 'family';
      record.status = 'absent';
      delete record.arrivedAt;
      record.absenceReason = from === 'sick' ? 'family' : 'sick';
      amendments.push({
        id: `AMEND-${String(amendmentNumber++).padStart(4, '0')}`,
        recordId: record.id, childId: child.id, date, field: 'absenceReason',
        from, to: record.absenceReason,
        reason: 'Fictional correction: guardian clarified the absence category.',
        by: 'Ms. Wong', at: asSingaporeInstant(date, 9, 20)
      });
    }
  });
});

STUDENTS.forEach((child, childIndex) => {
  if (childIndex < 12) {
    const minutes = [4, 11, 18, 23, 29, 36, 42, 48, 53, 57, 2, 14][childIndex];
    const hour = childIndex === 5 || childIndex === 8 ? 8 : 7;
    const minute = childIndex === 5 ? 36 : childIndex === 8 ? 42 : minuteValue(minutes);
    records.push({
      id: `ATT-${String(recordNumber++).padStart(4, '0')}`,
      childId: child.id, classId: 'k2-sunflower-2026', date: TODAY, status: 'present',
      arrivedAt: asSingaporeInstant(TODAY, hour, minute), method: 'staff',
      markedBy: 'teacher-lim', markedAt: asSingaporeInstant(TODAY, 9, 0)
    });
  } else if (childIndex === 12) {
    records.push({
      id: `ATT-${String(recordNumber++).padStart(4, '0')}`,
      childId: child.id, classId: 'k2-sunflower-2026', date: TODAY, status: 'absent',
      absenceReason: 'family', method: 'staff', markedBy: 'teacher-lim', markedAt: asSingaporeInstant(TODAY, 8, 5)
    });
  }
});

function minuteValue(value: number): number { return value; }

export const DEMO_ATTENDANCE_RECORDS: AttendanceRecord[] = records;
export const DEMO_ATTENDANCE_AMENDMENTS: AttendanceAmendment[] = amendments;
export const DEMO_CHECK_IN_CREDENTIALS: DemoCheckInCredential[] = STUDENTS.map((child, index) => ({
  childId: child.id,
  childCode: `FC-${String(1001 + index)}`,
  pin: String(4821 + index).padStart(4, '0'),
  cardId: `QR-FIC-${String(index + 1).padStart(4, '0')}`
}));
