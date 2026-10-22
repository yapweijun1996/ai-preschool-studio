# Module: Evidence Coverage & Review Queue

- Tier: Core
- Owns: Derived evidence coverage and report review queue views; it owns no source data
- Reads: Students (Children & Classes), observations (Observations), learning areas and coverage policy (Learning Framework), report lifecycle and narrative claims (Portfolio Studio / Report Review)
- Status: done (v0.8.0)

## Purpose

Helps teachers find learning areas that need recent evidence and helps reviewers process submitted reports in age order. The module derives its views from the framework, observations and report state; it does not store coverage or queue records.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Coverage for the class; reports they submitted for which changes were requested. | Filter coverage and add an observation in a selected area. The changes-requested list links to the report. |
| Reviewer / Principal | Class coverage and the review queue, including readiness, unverified claims and approval blocks. | Open a report for review. |
| School admin | Class coverage as a read-only view and review queue metadata (child, submitted date, days waiting, readiness and claim count). | No report narrative access or Open report action; no data changes from these views. |
| Parent | Neither page nor child-specific data. | No actions. |

Demo UI permissions are defined by [`src/roles/index.ts`](../../src/roles/index.ts). The role switcher is a display feature, not an access-control boundary; Studio Platform enforces real access.

## Flows

1. Teacher opens Students › Evidence coverage, chooses a term and filter, then uses Add observation on a cell to open the selected child and area in Observations.
2. Teacher saves an observation and returns to coverage; the derived count and status update from current state without a reload.
3. Reviewer opens Reports › Review queue, processes reports oldest submission first, and opens a report to inspect its narrative and evidence. School admins can see queue metadata but cannot open reports.
4. Teacher opens a changes-requested report from the waiting-for-teacher list, edits it and submits it again.
5. Reviewer, teacher and admin may inspect the applicable read-only views; parent access is denied with the access reason and a way back.

## Screens and states

- `/coverage`: default class coverage for Term 4. Desktop/tablet uses a captioned, horizontally scrollable table with a sticky child column; mobile (390px) uses child cards with four area rows. Each cell shows observation count, textual status and latest date; status is never communicated by colour alone. Summary bar shows children with gaps and counts of missing, thin and stale areas.
- Coverage filters: All, Needs attention, Missing and Stale. A filter with no rows shows an empty-filter message. When all cells are ok, show “Every child has enough recent evidence”. Loading and data error states expose a status message and retry where applicable. Teacher sees Add observation actions; reviewer/admin do not. Unknown routes show NotFound.
- `/reviews`: reviewer/admin default queue ordered by oldest submitted date, with child, submitted date, waiting days, readiness, unverified claim count, approval-block reason and Open report. Empty queue has an explanatory empty state. Teacher sees only the changes-requested list awaiting their action. Parent sees the planned-page access reason. Loading and data error states expose status and retry. The report itself retains the existing blocked, read-only and editable states.
- Dashboard: reviewers see the first three review items and a link to the full queue; teachers see Action required linking to coverage when gaps exist. Empty cards are omitted or show a translated empty state.
- Shared shell provides desktop, tablet (≤1024 bottom tabs) and mobile navigation, breadcrumbs, light/dark theme and en/中文/BM labels.

## Rules

- `coverageFor(state, studentId, term)` counts only that child's observations in the selected term and derives each area's latest date and milestone. `missing` takes precedence at zero observations; `thin` applies below the framework's `minPerArea`; otherwise `stale` applies when latest evidence is older than the framework's `staleAfterDays` measured from the fixed demo `TODAY`; otherwise status is `ok`. A date exactly `staleAfterDays` old is not stale.
- `classCoverage(state, term)` returns all students and summary counts; `needsAttention(state, term)` sorts by descending count of non-ok areas, then oldest latest evidence date, then child name. A child with no evidence has no oldest latest date and sorts before dated children when earlier keys tie.
- `reviewQueue(state)` returns reports in review by ascending `submittedAt`, with readiness, unverified claim count and approval-block reason, plus changes-requested reports waiting for the teacher. `submitForReview` records the ISO submitted date; resubmission refreshes it.
- `loadState` accepts only the current stored-state schema and complete report records; an older schema resets to fresh demo state.

## Compliance hooks

Derived coverage supports the licensee's obligations under ECDA by making evidence gaps visible for professional follow-up. Review queue metadata supports the licensee's obligations under PDPA through role-aware presentation in the demo; production authorization, retention and audit events remain Studio Platform responsibilities.

## Data port

Reads: `getCoverage(term): Promise<ClassCoverage>`, `getNeedsAttention(term): Promise<CoverageStudent[]>`, and `getReviewQueue(): Promise<ReviewQueue>`; all are derived from current state. The coverage page uses `getNeedsAttention` ordering for its Needs attention filter, and the dashboard reads coverage and queue data through the port. No writes are owned by this module. Observation writes continue through `addObservation`; report lifecycle writes continue through `submitForReview`, `requestChanges` and `approve`.

## Acceptance criteria

- [ ] Coverage and queue flows work in en, 中文 and BM, light and dark, desktop/tablet and mobile 390.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests cover every rule and boundary; e2e covers coverage, queue, responsive layout and role access.
- [ ] Independent review passed (no open P0/P1).
