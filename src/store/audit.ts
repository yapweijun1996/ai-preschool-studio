import type { TKey } from '../i18n';
import type { AuditAction, AuditEvent, AuditSummaryKey, DecisionEvent } from './reducer';

export const AUDIT_ACTIONS: readonly AuditAction[] = [
  'observation.added', 'report.submitted', 'report.changesRequested', 'report.approved',
  'report.released', 'report.reopened', 'role.switched', 'demo.reset'
];

const auditActionSet = new Set<string>(AUDIT_ACTIONS);
export function isAuditAction(value: string): value is AuditAction {
  return auditActionSet.has(value);
}

export const auditActionLabel: Record<AuditAction, TKey> = {
  'observation.added': 'pages.audit.observationAdded',
  'report.submitted': 'pages.audit.submitted',
  'report.changesRequested': 'pages.audit.changesRequested',
  'report.approved': 'pages.audit.approved',
  'report.released': 'pages.audit.released',
  'report.reopened': 'pages.audit.reopened',
  'role.switched': 'pages.audit.roleSwitched',
  'demo.reset': 'pages.audit.reset'
};

export function auditActionForDecision(decision: DecisionEvent): AuditAction {
  switch (decision.type) {
    case 'submitted': return 'report.submitted';
    case 'changesRequested': return 'report.changesRequested';
    case 'approved': return 'report.approved';
    case 'released': return 'report.released';
    case 'reopened': return 'report.reopened';
  }
}

export function auditSummaryForDecision(decision: DecisionEvent): { key: AuditSummaryKey; params?: { version: number } } {
  switch (decision.type) {
    case 'submitted': return { key: 'pages.audit.summarySubmitted' };
    case 'changesRequested': return { key: 'pages.audit.summaryChangesRequested' };
    case 'approved': return { key: 'pages.audit.summaryApproved', params: { version: decision.version } };
    case 'released': return { key: 'pages.audit.summaryReleased', params: { version: decision.version } };
    case 'reopened': return { key: 'pages.audit.summaryReopened' };
  }
}

export function auditEventForDecision(
  decision: DecisionEvent,
  studentId: string,
  actor: AuditEvent['actor']
): Omit<AuditEvent, 'id'> {
  const summary = auditSummaryForDecision(decision);
  return {
    at: decision.at,
    actor,
    action: auditActionForDecision(decision),
    target: { type: 'student', id: studentId },
    summaryKey: summary.key,
    ...(summary.params ? { summaryParams: summary.params } : {}),
    decision
  };
}

