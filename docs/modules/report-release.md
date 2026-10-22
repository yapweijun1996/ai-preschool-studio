# Module: Report Release & History

- Tier: Core
- Owns: Immutable approved report versions, release state and per-report decision history
- Reads: Draft narrative and claims (Portfolio Studio), observations (Observations), framework (Learning Framework), child (Children & Classes), audit events (Audit Log)
- Status: in progress (roadmap Phase 1)

## Purpose

Reviewers approve a frozen report version, then explicitly release that version for family use. Teachers and reviewers can inspect prior decisions and versions; family copies contain only the latest released version. This demo uses fictional data and does not provide a parent portal or production access control.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Draft and changes reports; released family copy preview/print | Edit and submit drafts; preview/print a released family copy |
| Reviewer / Principal | Report drafts, frozen versions and decision history | Request changes, approve, release, reopen for amendment, preview/print family copy |
| School admin | Read-only report metadata according to existing role limits | No report narrative, approval, release or reopen actions |
| Parent | No report routes; Family Portal is Phase 3 | No access yet |

Demo UI permissions are a display feature, not access control; Studio Platform enforces real authorization.

## Flows

1. Reviewer opens a report in review, resolves approval blocks and approves; the current content is copied into an immutable version.
2. Reviewer releases the approved latest version. Release is separate from approval and is idempotent.
3. Reviewer reopens an approved or released report with a nonblank reason. Editing creates the next draft; prior versions stay read-only.
4. A previously released version stays visible in family copy until a newer version is released.
5. Teacher or reviewer opens `/students/:id/report/family` to preview or print the latest released version. No release shows an illustrated empty state.
6. Report History lists submitted, changes requested, approved, released and reopened decisions in chronological order; reviewers can switch among frozen versions.

## Screens and states

- Report preview: draft, in review (including blocked reasons), approved and released badges; reviewer-only release and reopen actions; version badge and older version selector; history panel with date and actor. Reopen uses a required-reason accessible dialog with focus containment, Escape dismissal and focus restoration.
- Family copy: print-friendly A4 with released content only; omit evidence IDs/source chips, claim warnings, reviewer comments and internal workflow details. Empty state when no released version exists. Teacher and reviewer only.
- Screens include empty, loading, error and read-only states; reserve layout space during async reads. Desktop, tablet (≤1024 bottom tabs) and 390px mobile layouts use the shared shell; family print hides navigation and controls.

## Rules

- `approve` accepts only complete in-review reports with verified claims; it stores ISO `approvedAt`, `approvedBy`, framework version, milestone snapshot and an immutable deep copy of paragraphs/reflection.
- `contentHash` is deterministic for the frozen report content.
- Approved/family content reads from the selected frozen version, never the mutable draft.
- `releaseReport` accepts only the approved latest version; repeated release of that version is idempotent; other attempts return a typed refusal.
- `reopenReport` requires a nonblank reason and an approved or released report; it creates a draft for version n+1 without changing old versions. A previous release remains visible until another version is released.
- Report decisions are derived from the append-only event list; old versions and events are not edited or deleted.

## Compliance hooks

Frozen versions and decision history support the licensee's obligations under ECDA record keeping and PDPA accuracy and retention; applicable retention periods and record fields are to confirm. Family copy minimises internal review information. The demo does not claim compliance or implement production authorization.

## Data port

Reads: `getReportVersions(studentId)`, `getReportHistory(studentId)`, and `getReleasedVersion(studentId)`. Writes: `approve(studentId, approvedBy, atIso)`, `releaseReport(studentId, releasedBy, atIso)`, and `reopenReport(studentId, reason, reopenedBy, atIso)`. Guarded writes return typed refusal reasons.

## Acceptance criteria

- [ ] Approval freezes content with deterministic hash and ISO actor/time metadata.
- [ ] Release, reopen, history and family-copy rules have unit and browser coverage.
- [ ] Parent cannot reach report or audit routes; family copy is reviewer/teacher preview only.
- [ ] Every flow works in en, 中文 and BM, light/dark, desktop/tablet/mobile; axe has no serious/critical violations.
- [ ] Visual regression captures report history, family copy and audit log; no baseline PNGs are committed.
