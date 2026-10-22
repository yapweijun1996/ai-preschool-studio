# Module: Report Review & Release

- Tier: Core
- Owns: Report review decisions; frozen versions, release and decision history are described in [Report Release](report-release.md)
- Reads: Narrative and claims (Portfolio Studio), observations (Observations), framework (Learning Framework), child (Children & Classes)
- Status: done (v0.9.0)

## Purpose

Drives the draft → in review → changes requested → approved lifecycle. Approval freezes a version; a reviewer separately releases it to the family copy. The demo uses fictional data. Guardian accounts remain Phase 3.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Draft/changes reports, readiness, decision history and released family copy preview | Edit and submit drafts; preview/print a released family copy |
| Reviewer / Principal | Drafts, frozen versions and decision history | Request changes, link evidence, approve, release or reopen with a required reason |
| School admin | Existing read-only student and queue views | No report narrative, approval, release or reopen actions |
| Parent | Planned-role landing page; no reports navigation or report routes | No access yet; Family Portal is Phase 3 |

Demo UI permissions are a display feature, not access control; Studio Platform enforces real authorization.

## Flows

1. Open Report Preview from a profile or Studio; inspect content, status and readiness.
2. Teacher submits a complete draft; reviewer resolves claim blocks and approves or requests changes with a comment.
3. Approval stores ISO time and reviewer and freezes a report version; reviewer releases the latest approved version separately.
4. Reviewer reopens an approved/released report with a reason; the next draft does not change previous versions.
5. Teacher/reviewer opens `/students/:id/report/family` to preview or print the latest released version. No release shows an illustrated empty state.

## Screens and states

- Report Preview shows A4 content and lifecycle state. Approved content comes from the latest frozen version; history lists decisions, version selector shows prior versions read-only, and reviewer has separate release and reopen controls.
- Reopen uses a required-reason dialog with focus containment, Escape dismissal and focus restoration. Claim blocks show their reason and same-child evidence actions.
- Family copy shows only released content and omits evidence IDs/source chips, claim warnings and reviewer comments. It is available to teacher/reviewer preview only; parents have no route access.
- Empty narrative, blocked, read-only, error and loading states are shown. Desktop, tablet (≤1024 bottom tabs) and mobile (390) use shared layouts; print hides shell and controls.

## Rules

- `readiness` requires all framework domains and nonblank reflection for submission; every claim must cite evidence before approval.
- `approve` requires review status and unblocked readiness; it stores ISO `approvedAt`, `approvedBy`, framework version, milestones, deep-copied paragraphs/reflection and deterministic content hash.
- Approved content renders from its immutable version, never from a live draft.
- `releaseReport` accepts only the latest approved version and repeated release is idempotent; other transitions return typed refusals.
- `reopenReport` requires an approved report and nonblank reason. It starts the next draft without editing prior versions; an existing release remains visible until a new version is released.
- `selectReportHistory` derives ordered decisions and their comments/reasons from append-only audit events.

## Compliance hooks

Evidence-gated approval, frozen versions and release decisions support the licensee's obligations under ECDA record keeping and PDPA accuracy; applicable retention periods and record fields are to confirm. Production authorization, consent and retention enforcement are not implemented in this demo.

## Data port

Reads: `getReportVersions(studentId)`, `getReportHistory(studentId)`, `getApprovalBlock(studentId)` and existing student/content reads. Writes: `approve(studentId, approvedBy, atIso)`, `releaseReport(studentId, releasedBy, atIso)` and `reopenReport(studentId, reason, reopenedBy, atIso)`. Guarded writes return typed refusal reasons.

## Acceptance criteria

- [x] Approval, release, reopen, history and family-copy rules have unit and browser coverage.
- [x] Parent cannot reach reports or audit; family copy is reviewer/teacher preview only.
- [x] en, 中文 and BM; light/dark; desktop/tablet/mobile; axe has no serious/critical violations in covered routes.
- [x] Visual regression captures are defined in test code; screenshot PNGs are not committed.
- [ ] Keyboard-only and screen-reader walkthrough recorded; independent review and real-device sign-off remain part of production quality review.
