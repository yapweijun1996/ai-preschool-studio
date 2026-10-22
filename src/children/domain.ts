import type { Student } from '../data/demo';

export interface Class {
  id: string;
  name: string;
  level: 'K1' | 'K2';
  year: number;
  teacherIds: string[];
}

export interface Child extends Student {
  dateOfBirth: string;
  enrolledOn: string;
  status: 'active' | 'withdrawn';
  notes: { allergies?: string; medical?: string };
  classId: string;
}

export interface Guardian {
  id: string;
  childIds: string[];
  name: string;
  relationship: string;
  phone: string;
  email: string;
  preferredLanguage: string;
  isPrimary: boolean;
}

export interface AuthorisedCollector {
  id: string;
  childId: string;
  name: string;
  relationship: string;
  validFrom: string;
  validTo?: string;
  note: string;
}

export type FieldError = 'required' | 'phone-format' | 'email-format' | 'date-format' | 'date-order';
export type ValidationErrors<T extends string> = Partial<Record<T, FieldError>>;
export type WithdrawRefusal = 'unknown-child' | 'report-in-review';

const isDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const required = (value: string) => value.trim().length > 0;

export function validateChild(child: Pick<Child, 'name' | 'dateOfBirth' | 'enrolledOn' | 'classId' | 'homeLanguages'>): ValidationErrors<'name' | 'dateOfBirth' | 'enrolledOn' | 'classId' | 'homeLanguages'> {
  const errors: ValidationErrors<'name' | 'dateOfBirth' | 'enrolledOn' | 'classId' | 'homeLanguages'> = {};
  if (!required(child.name)) errors.name = 'required';
  if (!isDate(child.dateOfBirth)) errors.dateOfBirth = child.dateOfBirth ? 'date-format' : 'required';
  if (!isDate(child.enrolledOn)) errors.enrolledOn = child.enrolledOn ? 'date-format' : 'required';
  if (!required(child.classId)) errors.classId = 'required';
  if (!required(child.homeLanguages)) errors.homeLanguages = 'required';
  return errors;
}

export function validateGuardian(guardian: Pick<Guardian, 'name' | 'relationship' | 'phone' | 'email' | 'preferredLanguage'>): ValidationErrors<'name' | 'relationship' | 'phone' | 'email' | 'preferredLanguage'> {
  const errors: ValidationErrors<'name' | 'relationship' | 'phone' | 'email' | 'preferredLanguage'> = {};
  if (!required(guardian.name)) errors.name = 'required';
  if (!required(guardian.relationship)) errors.relationship = 'required';
  if (!/^\+65 9000 \d{4}$/.test(guardian.phone)) errors.phone = guardian.phone ? 'phone-format' : 'required';
  if (!/^[^\s@]+@example\.com$/.test(guardian.email)) errors.email = guardian.email ? 'email-format' : 'required';
  if (!required(guardian.preferredLanguage)) errors.preferredLanguage = 'required';
  return errors;
}

export function validateCollector(collector: Pick<AuthorisedCollector, 'name' | 'relationship' | 'validFrom' | 'validTo'>): ValidationErrors<'name' | 'relationship' | 'validFrom' | 'validTo'> {
  const errors: ValidationErrors<'name' | 'relationship' | 'validFrom' | 'validTo'> = {};
  if (!required(collector.name)) errors.name = 'required';
  if (!required(collector.relationship)) errors.relationship = 'required';
  if (!isDate(collector.validFrom)) errors.validFrom = collector.validFrom ? 'date-format' : 'required';
  if (collector.validTo && !isDate(collector.validTo)) errors.validTo = 'date-format';
  else if (collector.validTo && isDate(collector.validFrom) && collector.validTo < collector.validFrom) errors.validTo = 'date-order';
  return errors;
}

export function hasPrimaryGuardian(guardians: readonly Guardian[], childId: string): boolean {
  return guardians.some((guardian) => guardian.isPrimary && guardian.childIds.includes(childId));
}

export function withdrawRefusal(reportStatus: string | undefined): WithdrawRefusal | undefined {
  if (reportStatus === undefined) return 'unknown-child';
  if (reportStatus === 'review') return 'report-in-review';
  return undefined;
}
