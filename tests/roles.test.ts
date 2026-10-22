import { describe, expect, it } from 'vitest';
import { can, DEMO_ROLES, ROLE_CAPABILITIES, type Capability, type Role } from '../src/roles';

describe('demo role capability table', () => {
  it('defines the complete capability matrix', () => {
    const capabilities: Capability[] = ['observation.add', 'draft.edit', 'report.submit', 'report.review', 'report.view', 'settings.demo', 'catalog.view', 'students.view'];
    const expected: Record<Role, Capability[]> = {
      teacher: ['observation.add', 'draft.edit', 'report.submit', 'report.view', 'settings.demo', 'catalog.view', 'students.view'],
      reviewer: ['report.review', 'report.view', 'catalog.view', 'students.view'],
      admin: ['students.view', 'settings.demo', 'catalog.view'],
      parent: []
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
  });
});
