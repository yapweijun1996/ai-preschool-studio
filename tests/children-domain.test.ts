import { describe, expect, it } from 'vitest';
import { DEMO_CHILDREN, DEMO_CLASSES, DEMO_COLLECTORS, DEMO_GUARDIANS } from '../src/children/demo';
import { hasPrimaryGuardian, validateChild, validateCollector, validateGuardian, withdrawRefusal } from '../src/children/domain';
import { initialState, reducer } from '../src/store/reducer';

describe('Children & Classes domain', () => {
  it('seeds the existing 20 students into one class with fictional contacts', () => {
    expect(DEMO_CLASSES).toHaveLength(1);
    expect(Object.keys(DEMO_CHILDREN)).toHaveLength(20);
    expect(DEMO_GUARDIANS).toHaveLength(20);
    expect(DEMO_COLLECTORS).toHaveLength(20);
    expect(DEMO_GUARDIANS.every((guardian) => guardian.email.endsWith('@example.com'))).toBe(true);
    expect(DEMO_GUARDIANS.every((guardian) => /^\+65 9000 \d{4}$/.test(guardian.phone))).toBe(true);
    expect(Object.values(DEMO_CHILDREN).every((child) => !('nationalId' in child))).toBe(true);
  });

  it('validates required child fields and ISO calendar dates', () => {
    expect(validateChild({ name: '', dateOfBirth: '2026-02-31', enrolledOn: '', classId: '', homeLanguages: '' })).toEqual({
      name: 'required', dateOfBirth: 'date-format', enrolledOn: 'required', classId: 'required', homeLanguages: 'required'
    });
    expect(validateChild(DEMO_CHILDREN.aria)).toEqual({});
  });

  it('validates guardian required fields, Singapore demo phone and example.com email', () => {
    expect(validateGuardian({ name: '', relationship: '', phone: '123', email: 'name@real.test', preferredLanguage: '' })).toEqual({
      name: 'required', relationship: 'required', phone: 'phone-format', email: 'email-format', preferredLanguage: 'required'
    });
    expect(validateGuardian(DEMO_GUARDIANS[0])).toEqual({});
  });

  it('requires a primary guardian for a child', () => {
    expect(hasPrimaryGuardian(DEMO_GUARDIANS, 'aria')).toBe(true);
    expect(hasPrimaryGuardian(DEMO_GUARDIANS.map((guardian) => ({ ...guardian, isPrimary: false })), 'aria')).toBe(false);
  });

  it('validates collector required fields and inclusive validity order without local timezone', () => {
    expect(validateCollector({ name: '', relationship: '', validFrom: '', validTo: '2026-01-01' })).toEqual({ name: 'required', relationship: 'required', validFrom: 'required' });
    expect(validateCollector({ name: 'Fictional', relationship: 'Family', validFrom: '2026-10-23', validTo: '2026-10-22' })).toEqual({ validTo: 'date-order' });
    expect(validateCollector({ name: 'Fictional', relationship: 'Family', validFrom: '2026-10-22', validTo: '2026-10-22' })).toEqual({});
  });

  it('returns typed withdrawal refusals for unknown and in-review reports', () => {
    expect(withdrawRefusal(undefined)).toBe('unknown-child');
    expect(withdrawRefusal('review')).toBe('report-in-review');
    expect(withdrawRefusal('draft')).toBeUndefined();
  });

  it('audits child, guardian, collector updates and withdrawal without copying sensitive notes', () => {
    let state = initialState();
    const at = '2026-10-22T12:00:00.000Z';
    state = reducer(state, { type: 'updateChild', child: { ...state.children.aria, notes: { allergies: 'secret health detail' } }, at });
    state = reducer(state, { type: 'upsertGuardian', guardian: { ...state.guardians[0], name: 'Fictional Updated Guardian' }, at });
    state = reducer(state, { type: 'upsertCollector', collector: { ...state.collectors[0], note: 'secret pickup detail' }, at });
    state = reducer(state, { type: 'withdrawChild', childId: 'aria', at });
    expect(state.children.aria.status).toBe('withdrawn');
    expect(state.auditEvents.slice(-4).map((event) => event.summaryKey)).toEqual([
      'pages.audit.summaryChildUpdated', 'pages.audit.summaryGuardianUpdated', 'pages.audit.summaryCollectorUpdated', 'pages.audit.summaryChildWithdrawn'
    ]);
    expect(JSON.stringify(state.auditEvents.slice(-4))).not.toContain('secret');
    expect(reducer(state, { type: 'withdrawChild', childId: 'ethan', at })).toBe(state);
  });

  it('does not allow removing the last primary guardian', () => {
    const state = initialState();
    expect(reducer(state, { type: 'removeGuardian', guardianId: 'guardian-aria-1' })).toBe(state);
  });
});
