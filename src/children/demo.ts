import { STUDENTS } from '../data/demo';
import type { AuthorisedCollector, Child, Class, Guardian } from './domain';

export const DEMO_CLASSES: Class[] = [
  { id: 'k2-sunflower-2026', name: 'K2 Sunflower', level: 'K2', year: 2026, teacherIds: ['teacher-lim'] }
];

export const DEMO_CHILDREN: Record<string, Child> = Object.fromEntries(STUDENTS.map((student, index) => {
  const birthYear = student.age === 5 ? 2021 : 2022;
  return [student.id, {
    ...student,
    dateOfBirth: `${birthYear}-03-${String((index % 24) + 1).padStart(2, '0')}`,
    enrolledOn: `2024-01-${String((index % 25) + 1).padStart(2, '0')}`,
    status: 'active',
    notes: index === 0 ? { allergies: 'Fictional note: mild pollen sensitivity.' } : {},
    classId: 'k2-sunflower-2026'
  }];
}));

export const DEMO_GUARDIANS: Guardian[] = STUDENTS.map((student, index) => ({
  id: `guardian-${student.id}-1`,
  childIds: [student.id],
  name: `Fictional Guardian ${String(index + 1).padStart(2, '0')}`,
  relationship: 'Parent',
  phone: `+65 9000 ${String(1000 + index).padStart(4, '0')}`,
  email: `guardian${String(index + 1).padStart(2, '0')}@example.com`,
  preferredLanguage: 'English',
  isPrimary: true
}));

export const DEMO_COLLECTORS: AuthorisedCollector[] = STUDENTS.map((student, index) => ({
  id: `collector-${student.id}-1`,
  childId: student.id,
  name: `Fictional Collector ${String(index + 1).padStart(2, '0')}`,
  relationship: 'Family member',
  validFrom: '2026-01-01',
  note: 'Identity is checked against photo ID at pick-up in Pick-up & Release (Phase 2).'
}));

