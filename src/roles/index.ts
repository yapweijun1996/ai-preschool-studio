import { ADMIN, PARENT, REVIEWER, TEACHER } from '../data/demo';

export type Role = 'teacher' | 'reviewer' | 'admin' | 'parent';

export type Capability =
  | 'observation.add'
  | 'draft.edit'
  | 'report.submit'
  | 'report.review'
  | 'report.view'
  | 'dashboard.view'
  | 'settings.view'
  | 'demo.controls'
  | 'catalog.view'
  | 'students.view'
  | 'coverage.view'
  | 'reviews.view'
  | 'reviews.changes'
  | 'audit.view'
  | 'children.edit'
  | 'contacts.view'
  | 'health.view'
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.amend';

export const ROLE_CAPABILITIES: Readonly<Record<Role, readonly Capability[]>> = {
  teacher: ['dashboard.view', 'observation.add', 'draft.edit', 'report.submit', 'report.view', 'settings.view', 'demo.controls', 'catalog.view', 'students.view', 'coverage.view', 'reviews.changes', 'contacts.view', 'health.view', 'attendance.view', 'attendance.mark', 'attendance.amend'],
  reviewer: ['dashboard.view', 'report.review', 'report.view', 'settings.view', 'catalog.view', 'students.view', 'coverage.view', 'reviews.view', 'audit.view', 'attendance.view'],
  admin: ['dashboard.view', 'students.view', 'settings.view', 'demo.controls', 'catalog.view', 'coverage.view', 'reviews.view', 'audit.view', 'children.edit', 'contacts.view', 'health.view', 'attendance.view', 'attendance.mark', 'attendance.amend'],
  parent: ['dashboard.view', 'settings.view']
};

export function can(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export const DEMO_ROLES = [
  { role: 'teacher', name: TEACHER, initials: 'ML', labelKey: 'shell.roles.teacher' },
  { role: 'reviewer', name: REVIEWER, initials: 'MT', labelKey: 'shell.roles.reviewer' },
  { role: 'admin', name: ADMIN, initials: 'MW', labelKey: 'shell.roles.admin' },
  { role: 'parent', name: PARENT, initials: 'AG', labelKey: 'shell.roles.parent' }
] as const satisfies readonly { role: Role; name: string; initials: string; labelKey: `shell.roles.${Role}` }[];

export function demoRole(role: Role) {
  return DEMO_ROLES.find((item) => item.role === role)!;
}

export function isRole(value: string | null): value is Role {
  return DEMO_ROLES.some((item) => item.role === value);
}
