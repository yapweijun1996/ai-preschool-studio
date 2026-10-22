import { ADMIN, PARENT, REVIEWER, TEACHER } from '../data/demo';

export type Role = 'teacher' | 'reviewer' | 'admin' | 'parent';

export type Capability =
  | 'observation.add'
  | 'draft.edit'
  | 'report.submit'
  | 'report.review'
  | 'report.view'
  | 'settings.demo'
  | 'catalog.view'
  | 'students.view';

export const ROLE_CAPABILITIES: Readonly<Record<Role, readonly Capability[]>> = {
  teacher: ['observation.add', 'draft.edit', 'report.submit', 'report.view', 'settings.demo', 'catalog.view', 'students.view'],
  reviewer: ['report.review', 'report.view', 'catalog.view', 'students.view'],
  admin: ['students.view', 'settings.demo', 'catalog.view'],
  parent: []
};

export function can(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export const DEMO_ROLES = [
  { role: 'teacher', name: TEACHER, labelKey: 'shell.roles.teacher' },
  { role: 'reviewer', name: REVIEWER, labelKey: 'shell.roles.reviewer' },
  { role: 'admin', name: ADMIN, labelKey: 'shell.roles.admin' },
  { role: 'parent', name: PARENT, labelKey: 'shell.roles.parent' }
] as const satisfies readonly { role: Role; name: string; labelKey: `shell.roles.${Role}` }[];

export function isRole(value: string | null): value is Role {
  return DEMO_ROLES.some((item) => item.role === value);
}
