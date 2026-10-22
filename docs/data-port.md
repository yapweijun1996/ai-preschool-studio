# Data port interface

`DataPort` is the framework-free async boundary between screens and data. Studio Platform can
implement this contract over its REST or RPC API. The demo implementation wraps the existing
reducer and selectors; pages still use the current context directly in this phase. They migrate
to `useDataPort()` in roadmap Phase 0 step 2.

The method names follow the Data port sections in `docs/modules/*.md`. Duplicate proposals are
listed once. `PortResult<T>` represents guarded writes as either `{ ok: true, value }` or
`{ ok: false, reason }`.

| Method | Module | Rule | Demo implementation |
|---|---|---|---|
| `getStudentSummary` | Observations, Learning progress, Portfolio studio, Report review | Existing student summary; unknown ID gives `undefined`. | [demoAdapter.ts](../src/data/demoAdapter.ts#L32) |
| `getCurrentFramework` | Observations, Learning framework | Current published framework. | [demoAdapter.ts](../src/data/demoAdapter.ts#L33) |
| `getPeriod` | Observations, Learning framework | Date must fall in a configured period. | [demoAdapter.ts](../src/data/demoAdapter.ts#L34) |
| `addObservation` | Observations | Date must be in a period; reducer assigns ID and term. | [demoAdapter.ts](../src/data/demoAdapter.ts#L35) |
| `getAllSummaries` | Learning progress, App shell | Summary for every seeded student. | [demoAdapter.ts](../src/data/demoAdapter.ts#L47) |
| `getMilestones` | Learning progress, Portfolio studio, Report review | Latest evidence per domain in selected term. | [demoAdapter.ts](../src/data/demoAdapter.ts#L48) |
| `getObservations` | Observations, Learning progress, Report review | Filter by child and term (default Term 4). | [demoAdapter.ts](../src/data/demoAdapter.ts#L49) |
| `getReadiness` | Portfolio studio, Report review | Computed from written domains, reflection and claims. | [demoAdapter.ts](../src/data/demoAdapter.ts#L50) |
| `getUnverifiedClaims` | Portfolio studio, Report review | Claims without evidence sources. | [demoAdapter.ts](../src/data/demoAdapter.ts#L51) |
| `getDraft` | Portfolio studio, Report review | Returns paragraphs and reflection for the child. | [demoAdapter.ts](../src/data/demoAdapter.ts#L52) |
| `getFramework` | Portfolio studio, Learning framework | Requested published version or current fallback. | [demoAdapter.ts](../src/data/demoAdapter.ts#L56) |
| `startDraft` | Portfolio studio | Not-started report with observations only. | [demoAdapter.ts](../src/data/demoAdapter.ts#L57) |
| `fillMissingDomains` | Portfolio studio | Only editable drafts/changes reports; existing written domains remain. | [demoAdapter.ts](../src/data/demoAdapter.ts#L63) |
| `linkSource` | Portfolio studio, Report review | Evidence must belong to the child; approved content is locked. | [demoAdapter.ts](../src/data/demoAdapter.ts#L68) |
| `removeSentence` | Portfolio studio | Wording cannot change during review or after approval. | [demoAdapter.ts](../src/data/demoAdapter.ts#L74) |
| `applySuggestion` | Portfolio studio | Target paragraph must exist and cited evidence must belong to child. | [demoAdapter.ts](../src/data/demoAdapter.ts#L79) |
| `restoreParagraph` | Portfolio studio | Wording cannot change during review or after approval. | [demoAdapter.ts](../src/data/demoAdapter.ts#L87) |
| `setReflection` | Portfolio studio | Wording cannot change during review or after approval. | [demoAdapter.ts](../src/data/demoAdapter.ts#L92) |
| `submitForReview` | Portfolio studio, Report review | Every domain and nonblank reflection required. | [demoAdapter.ts](../src/data/demoAdapter.ts#L97) |
| `getApprovalBlock` | Report review | Reports the existing approval guard. | [demoAdapter.ts](../src/data/demoAdapter.ts#L101) |
| `requestChanges` | Report review | Only reports in review can receive changes; other statuses return `report-not-editable`. | [demoAdapter.ts](../src/data/demoAdapter.ts#L102) |
| `approve` | Report review / Release | Requires review status, readiness and evidence for every claim; stores ISO `approvedAt` and `approvedBy` and freezes a version. | [demoAdapter.ts](../src/data/demoAdapter.ts) |
| `getReportVersions` | Report release | Returns immutable approved versions in ascending version order. | Demo adapter reads report state. |
| `getReportHistory` | Report release | Returns submitted, changes-requested, approved, released and reopened decisions. | Demo adapter reads report state. |
| `releaseReport` | Report release | Releases only the latest approved version; repeated release is idempotent. | Demo adapter dispatches the release reducer action. |
| `reopenReport` | Report release | Requires an approved report and nonblank reason; preserves old versions. | Demo adapter dispatches the reopen reducer action. |
| `getAuditLog` | Audit log | Returns newest-first events filtered by action, child and inclusive date range. | Demo adapter uses `selectAuditLog`. |
| `getCoverage` | Evidence coverage | Returns all children with per-area counts, dates and statuses plus class totals for a term. | [demoAdapter.ts](../src/data/demoAdapter.ts) |
| `getNeedsAttention` | Evidence coverage | Returns children with gaps ordered by gap count and oldest latest evidence. | [demoAdapter.ts](../src/data/demoAdapter.ts) |
| `getReviewQueue` | Evidence coverage, Report review | Returns oldest-first review items and changes-requested items awaiting teachers. | [demoAdapter.ts](../src/data/demoAdapter.ts) |

## Refusal reasons

| Reason | Meaning |
|---|---|
| `unknown-student` | The requested child does not exist. |
| `wrong-child-observation` | An evidence ID is missing or belongs to another child. |
| `date-outside-period` | Observation date falls outside every reporting period. |
| `report-locked` | Approved report content is frozen. |
| `report-not-editable` | Wording is paused during review, or a review-only action was called outside review. |
| `not-ready` | Required domains/reflection are missing, or approval is incomplete. |
| `unverified-claims` | One or more narrative claims lack evidence. |
| `invalid-target` | The requested transition is not valid for the target's current state, or the target sentence/paragraph is absent. |
| `no-observations` | A draft cannot be started because no evidence exists. |
| `not-approved` | A report has no approved latest version to release. |
| `reason-required` | Reopening requires a nonblank reason. |

## Implementing an API adapter

Keep the same async method names, parameter shapes and typed refusal reasons. Map each read to a
REST/RPC request and each write to a server command; the server remains authoritative for the same
domain rules and assigns observation IDs. Translate structured API errors into `PortRefusal`
values rather than throwing strings. `approve` accepts and stores an ISO timestamp and reviewer
identity; views format the timestamp using the active locale.

The adapter is framework-free. React consumers obtain the stable demo adapter through
`useDataPort()` from `src/store/PortfolioContext.tsx`; replacing that binding with a platform
adapter is the planned page migration in Phase 0 step 2.

### Reachable `invalid-target` cases

The demo adapter returns `invalid-target` for these reducer no-ops: `startDraft` when a report is
not in `notStarted` state or already has draft paragraphs; `fillMissingDomains` when the report
cannot be filled or has no unwritten domains; `linkSource` when the sentence ID is absent;
`removeSentence` when its sentence ID is absent; `applySuggestion` when its paragraph ID is absent;
`restoreParagraph` when its paragraph ID is absent; `submitForReview` when a structurally ready
report is already in review, approved, or not started; and `approve` when the report is not in
review. The adapter handles missing observation ownership, missing suggestion citations, edit
locks, readiness failures, and approval claims with their more specific refusal reasons first.

