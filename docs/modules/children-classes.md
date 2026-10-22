# Module: Children & Classes

- Tier: Core
- Owns: Child, Class, Enrolment, Guardian and AuthorisedCollector
- Reads: Student portfolio and report status (Portfolio Studio / Report Review); staff identity references (Schools & Accounts, planned)
- Status: done (v0.10.0)

## Purpose

Provides a class roster and a controlled record of each child's enrolment, guardians and authorised
collectors. It deliberately does not record national ID numbers, perform identity checks, manage
attendance, or provide a parent portal. The demo uses fictional records only. No national ID numbers
are stored or displayed. Health and allergy notes are sensitive and restricted to teachers and school
admins.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Child basics, class and enrolment; guardian contacts; health and allergy notes; authorised collectors | No edits. Additions and changes are made by school admin. |
| Reviewer / Principal | Child basics and class only | No child record changes. Contacts and health notes are hidden. |
| School admin | Child basics, class, enrolment, guardian contacts, health and allergy notes, authorised collectors | Create and update child, guardian and collector records; remove guardians/collectors; withdraw a child when no report is in review. |
| Parent | No child page or child-specific data | No access; Family Portal remains a separate planned module. |

Access is enforced by Studio Platform; the demo shows it with the role switcher. `children.edit` is
admin-only; `contacts.view` and `health.view` are teacher/admin capabilities. A role switcher is not
an authorization boundary.

## Flows

1. Teacher or reviewer opens Classes › K2 Sunflower, filters active or withdrawn children, and opens
   a child profile. Reviewer sees basic details only; teacher also sees contacts and permitted health
   notes.
2. School admin opens a child's Family & enrolment section, edits child details or adds/edits/removes
   guardians and authorised collectors, then saves. Invalid fields are identified inline; removal
   requires confirmation.
3. School admin withdraws a child from the profile. If the child's report is in review, the action is
   blocked and the reason is shown. Otherwise the admin confirms and the change is audited.
4. Parent opens the child route and receives the planned-page access reason without child data.

## Screens and states

- `/classes`: class header identifies the teacher and enrolment count; roster rows show name, age,
  status and class, with Active / Withdrawn filters and a profile link. Empty classes use the shared
  illustration component. Loading reserves roster space; load and save failures have a retry or
  translated notice. On tablet (≤1024) the existing bottom tabs remain; mobile (390) uses stacked
  roster cards.
- `/students/:id` (existing profile): Family & enrolment section shows class, level, year, enrolment
  date, date of birth, home languages and status. Guardian phone numbers are masked except for
  `contacts.view`; email is fictional (`example.com`). Authorised collectors show validity dates and
  the pick-up photo-ID check note. Health notes are visible only with `health.view`; others see
  “Restricted — visible to teachers and school admins”. Non-admins see read-only content and a
  reason where an edit action would be. Admin dialogs/pages have labelled fields, summary and field
  errors, confirmation for remove/withdraw, managed focus, and saving/saved/error feedback.
- Parent has no child navigation or profile data. Unknown child and empty related lists show translated
  explanatory states and the shared empty illustration. All states support desktop, tablet and mobile.

## Rules

- `validateChild`, `validateGuardian` and `validateCollector` return field-specific required-field,
  phone, email and date-range errors; guardian email must use `example.com` in demo data.
- `hasPrimaryGuardian` requires at least one primary guardian for every child after guardian changes.
- `canWithdrawChild` refuses withdrawal while that child's report is in review and returns the typed
  `report-in-review` refusal reason.
- `updateChild`, `upsertGuardian`, `removeGuardian`, `upsertCollector`, `removeCollector` and
  `withdrawChild` append fixed, translatable audit summary keys. Summary values contain no free text
  or sensitive notes.
- `updateChild` cannot change enrolment status; `withdrawChild` is the only status transition. The
  demo has no re-enrolment action, so withdrawn records remain withdrawn.
- All dates are ISO calendar dates and comparisons are timezone-independent.

## Compliance hooks

Class and enrolment records support the licensee's obligations under ECDA for required child and
enrolment record keeping; the exact applicable record fields and retention schedule are to confirm.
Role-limited access to contacts and sensitive health/allergy notes supports the licensee's obligations
under PDPA purpose limitation, accuracy and protection. The purpose and lawful basis for each health
field, correction workflow, retention period and disclosure duties are to confirm with the licensee.
Audit events record that a record changed without copying its health notes or contact values.
Authorised collector records support the licensee's obligations under ECDA record keeping; identity
verification at pick-up belongs to Pick-up & Release (Phase 2), where photo ID is checked in person.
No identity number is recorded. No national ID numbers are stored or displayed.

## Data port

Reads: `getClasses()`, `getChild(id)`, `getGuardians(childId)`, `getCollectors(childId)`.
Writes: `updateChild`, `upsertGuardian`, `removeGuardian`, `upsertCollector`, `removeCollector` and
`withdrawChild`; each returns a typed `PortResult` refusal for invalid or blocked changes. The demo
adapter owns no real identity verification and all seeded contact details are fictional.

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop, tablet and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).

## Class seed decision

Keep the existing K2 Sunflower class of 20 as the only seeded class. A second K1 Rainbow class would
change every existing class-wide portfolio, report, coverage and navigation assumption, so it is
planned until those screens support multiple classes explicitly. This module introduces the class
shape and roster without changing the existing portfolio scope.
