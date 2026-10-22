# Module: Report Review & Release

- Tier: Core
- Owns: Report status, reviewer comment, approval time, approved framework version and approved milestones
- Reads: Narrative paragraphs/reflection and source claims (Portfolio Studio), observations (Observations), learning framework (Learning Framework), student (Children & Classes; static fictional records)
- Status: partial (no frozen version or history)

## Purpose

Displays a one-page fictional report preview and drives the draft → in review → changes requested → approved lifecycle. Approval records a time, framework version and milestone snapshot, but the demo does not create a frozen report version, decision history, audit log or family release.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Draft/changes reports, readiness and report status. | Edit in Studio and submit; in review, sees why review actions are restricted and can switch to Reviewer. |
| Reviewer / Principal | Reports in review, readiness and evidence claims. | Request changes, link same-child evidence or approve when unblocked. |
| School admin | Read-only Students views; admin planned landing page. | No report review actions. |
| Parent | Planned-role landing page; no reports navigation. | Released reports are planned for Phase 3. |

Demo UI permissions are defined by [`src/roles/index.ts`](../../src/roles/index.ts). The role switcher is a display feature, not an access-control boundary; Studio Platform enforces real access.

## Flows

1. Open Report Preview from the profile or Studio; review report content, lifecycle status and readiness checks.
2. For draft/changes, return to Studio or submit when all four domains have content and reflection is nonblank.
3. In review, inspect unverified claims; link a same-student observation or return to Studio, then approve only when complete and every sentence has evidence.
4. Instead of approval, enter/request changes; the report becomes Changes requested with reviewer name/date/comment.
5. Approved state displays approval metadata and provides browser print/PDF action; this is not a persisted family release.

## Screens and states

- Report Preview default: A4 sample report and status/readiness panel, narrative, reflection, framework and milestones (`src/pages/ReportPreview.tsx:34-46,177-219`). Empty narrative is shown when no paragraphs exist (`src/pages/ReportPreview.tsx:189`). The page reads `state.paragraphs[id]` and `state.reflections[id]` directly (`src/pages/ReportPreview.tsx:39,210`).
- notStarted: Open Studio action; draft/changes: Edit and Submit; review: Request changes and Approve; approved: dashboard and Export PDF / Print (`src/pages/ReportPreview.tsx:60-99`).
- Incomplete submit is disabled with reason; approval block distinguishes invalid status, incomplete report and unverified claims (`src/store/reducer.ts:211-227`; `src/pages/ReportPreview.tsx:135-157`). Claims can be linked to the most recent Term 4 observation of that domain; linking is a no-op if none exists (`src/pages/ReportPreview.tsx:52-56,144-157`).
- Changes state shows reviewer comment; request-changes editor is dirty-guarded while open. The change note is pre-filled, and an empty note is accepted (known gap) (`src/pages/ReportPreview.tsx:21-33,65,105-110,129-164`). No network save-failed state is implemented.
- Approved state reports approval date/name and prints the approved milestone snapshot; approved content is frozen by reducer guards (`src/pages/ReportPreview.tsx:35-45,165-172,190-216`; `src/store/reducer.ts:71-75,158-167`).
- Mobile stacks review panel and report sheet and collapses readiness checks; other breakpoints show sheet with side panel (`src/pages/ReportPreview.tsx:101-174,221-258`). Shared AppShell supplies bottom tabs at ≤1024px (`src/components/AppShell.tsx:368-470`).

## Rules

- `readiness` requires every framework domain to contain a sentence and a nonblank reflection to submit; unverified claims additionally block approval (`src/store/reducer.ts:185-209`).
- `approvalBlock` returns a status reason unless report is in review, an incomplete reason if domains/reflection are missing, a claim count if any sentence is uncited, otherwise null (`src/store/reducer.ts:211-223`). `canApprove` is true only when no block exists (`src/store/reducer.ts:225-227`).
- `reducer` `submitForReview` accepts only an existing non-approved, non-review, started report with `readiness.canSubmit` (`src/store/reducer.ts:143-149`).
- `reducer` `requestChanges` only changes an in-review report; it records simulated reviewer name, supplied date and text (`src/store/reducer.ts:150-157`). The default change note is pre-filled and an empty note is accepted (known gap) (`src/pages/ReportPreview.tsx:28,65`).
- `reducer` `approve` only succeeds when `canApprove`; it stores approval time, current framework version and Term 4 milestone snapshot (`src/store/reducer.ts:158-167`). Demo passes a localized display string for `at`, not ISO; displayed reviewer name is constant `REVIEWER`, not stored (`src/pages/ReportPreview.tsx:50,168,214`).
- `milestonesFrom` selects the latest observation for each domain within the term; reports use saved milestones after approval (`src/store/reducer.ts:229-241`; `src/pages/ReportPreview.tsx:35-36`).
- Frozen report version, decision history, audit events and family release are not implemented; Not in Studio Demo yet — planned (roadmap Phase 1 Report Release & History + Audit Log).

## Compliance hooks

Evidence-gated approval and recorded reviewer comment support the licensee's obligations under ECDA; report content and approval metadata support the licensee's obligations under PDPA (Singapore) only as a demo design reference. The demo does not implement access controls, retention, consent, release history or audit events. Not in Studio Demo yet — planned (roadmap Phase 1 Report Release & History + Audit Log; Phase 3 Family Portal; Phase 4 Privacy Centre and Records Retention).

## Data port

Proposed async interfaces:
- `getStudentSummary(studentId: string): Promise<StudentSummary | undefined>` (proposed; demo implementation: `studentSummary` `src/store/selectors.ts:15-27`)
- `getReadiness(studentId: string): Promise<Readiness>` (proposed; demo implementation: `readiness` `src/store/reducer.ts:185-209`)
- `getApprovalBlock(studentId: string): Promise<ApprovalBlock>` (proposed; demo implementation: `approvalBlock` `src/store/reducer.ts:211-223`)
- `getObservations(studentId: string, term?: 3 | 4): Promise<Observation[]>` (proposed; demo implementation: `observationsFor` `src/store/reducer.ts:243-245`)
- `getUnverifiedClaims(studentId: string): Promise<UnverifiedClaim[]>` (proposed; demo implementation: `unverifiedClaims` `src/store/reducer.ts:175-183`)
- `getDraft(studentId: string): Promise<{ paragraphs: Paragraph[]; reflection: string }>` (proposed; demo implementation: direct reads of `state.paragraphs[id]` and `state.reflections[id]` `src/pages/ReportPreview.tsx:39,210`)
- `getMilestones(studentId: string, term: 3 | 4): Promise<Record<DomainKey, Milestone | null>>` (proposed; demo implementation: `milestonesFor` `src/store/selectors.ts:33-38`)
- `getFramework(version?: string): Promise<Framework>` (proposed; demo implementation: `frameworkFor` `src/framework/index.ts:82-86`)

Writes (proposed async; demo dispatches corresponding action):
- `submitForReview(studentId: string): Promise<void>` (demo: dispatch `{type:'submitForReview', ...}`)
- `requestChanges(studentId: string, text: string, date: string): Promise<void>` (demo: dispatch `{type:'requestChanges', ...}`)
- `approve(studentId: string, approvedBy: string, at: string /* ISO */): Promise<void>` (proposed accepts ISO time and reviewer identity; demo dispatches `{type:'approve', ...}` with localized display string; reviewer is constant `REVIEWER`)
- `linkSource(studentId: string, sentenceId: string, obsId: string): Promise<void>` (demo: dispatch `{type:'linkSource', ...}`)

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
