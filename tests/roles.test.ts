import { describe, expect, it } from 'vitest';
import { can, DEMO_ROLES, ROLE_CAPABILITIES, type Capability, type Role } from '../src/roles';

describe('demo role capability table', () => {
  it('defines the complete capability matrix', () => {
    const capabilities: Capability[] = ['dashboard.view', 'observation.add', 'draft.edit', 'report.submit', 'report.review', 'report.view', 'settings.view', 'demo.controls', 'catalog.view', 'students.view', 'coverage.view', 'reviews.view', 'reviews.changes'];
    const expected: Record<Role, Capability[]> = {
      teacher: ['dashboard.view', 'observation.add', 'draft.edit', 'report.submit', 'report.view', 'settings.view', 'demo.controls', 'catalog.view', 'students.view', 'coverage.view', 'reviews.changes'],
      reviewer: ['dashboard.view', 'report.review', 'report.view', 'settings.view', 'catalog.view', 'students.view', 'coverage.view', 'reviews.view'],
      admin: ['dashboard.view', 'students.view', 'settings.view', 'demo.controls', 'catalog.view', 'coverage.view', 'reviews.view'],
      parent: ['dashboard.view', 'settings.view']
    };
    expect(Object.keys(ROLE_CAPABILITIES).sort()).toEqual(['admin', 'parent', 'reviewer', 'teacher']);
    for (const role of Object.keys(expected) as Role[]) {
      expect(ROLE_CAPABILITIES[role]).toEqual(expected[role]);
      for (const capability of capabilities) expect(can(role, capability)).toBe(expected[role].includes(capability));
    }
  });

  it('has one fictional account and label key per role', () => {
    expect(DEMO_ROLES.map((item) => item.role)).toEqual(['teacher', 'reviewer', 'admin', 'parent']);
    expect(DEMO_ROLES.map((item) => item.labelKey)).toEqual(['shell.roles.teacher', 'shell.roles.reviewer', 'shell.roles.admin', 'shell.roles.parent']);
    expect(DEMO_ROLES.map((item) => item.name)).toEqual(['Ms. Lim', 'Ms. Tan', 'Mr. Wong', "Aria's guardian"]);
    expect(DEMO_ROLES.map((item) => item.initials)).toEqual(['ML', 'MT', 'MW', 'AG']);
  });
});
