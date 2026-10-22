# Module: Audit Log

- Tier: Platform
- Owns: Append-only demo audit events and audit-log selectors
- Reads: Portfolio lifecycle events and role state (Report Release & History, Observations, Demo roles)
- Status: done (v0.9.0)

## Purpose

Gives reviewers and school admins a read-only chronological view of meaningful demo actions for review and traceability. It does not replace a production audit service or provide compliance certification.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | No audit log | No actions |
| Reviewer / Principal | Filtered audit events | Read and filter only |
| School admin | Filtered audit events | Read and filter only |
| Parent | No audit route | No actions |

Demo UI permissions are a display feature, not access control; Studio Platform enforces real authorization.

## Flows

1. Reviewer or admin opens `/audit` from Reports context, Settings or global search.
2. User filters by action, child and date range; clearing filters restores newest-first events.
3. User reads actor name and role, timestamp, action, target and concise summary; no edit or delete controls exist.

## Screens and states

- Desktop table and mobile event list show the same fields, newest first. Action, child and date filters are keyboard accessible.
- Empty filter result explains how to clear filters. Empty, loading and error states reserve content space and provide status messaging.
- Parent and teacher are denied access with a translated explanation. Shared shell supplies tablet/mobile navigation and light/dark theme.

## Rules

- `AuditEvent` has immutable `id`, ISO `at`, actor `{ role, name }`, a closed action union, target `{ type, id }` and summary.
- Reducer appends events for observation added, draft submitted, changes requested, report approved, released, reopened, demo role switched and demo data reset.
- Application transitions never edit or delete prior events. `selectAuditLog` filters by action, child and inclusive date range and sorts newest first.

## Compliance hooks

An append-only activity trail supports the licensee's obligations under PDPA accountability and ECDA record keeping; event scope, access, retention and production tamper resistance are to confirm. The demo does not claim compliance.

## Data port

Read: `getAuditLog(filters)` returns newest-first matching `AuditEvent[]`. No writes are exposed through the screen-facing port; events are appended by domain transitions in the reducer.

## Acceptance criteria

- [ ] Every audited action and append-only invariant has unit coverage.
- [ ] Reviewer/admin can filter and read the log; parent cannot reach it.
- [ ] en, 中文 and BM; light/dark; desktop table and mobile list; axe has no serious/critical violations.
- [ ] Visual capture exists in test code; no PNG baseline is committed.
