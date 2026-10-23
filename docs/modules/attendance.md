# Module: Attendance

- Tier: Operations
- Owns: AttendanceRecord, AttendanceAmendment and check-in method configuration
- Reads: Child, Class and AuthorisedCollector (Children & Classes); consent (Privacy Centre, planned; demo placeholder: face-match consent is not recorded for any child)
- Status: done (v0.11.0)

## Purpose

Records each child's daily presence, arrival and departure, and provides a traceable correction history. It does not own enrolment, consent, identity verification or pick-up release. Data is fictional. The demo never captures or processes faces, stores biometric data or uses national ID numbers.

The demo uses one session-wide clock anchored at 09:00 Asia/Singapore on `TODAY`, advancing by real elapsed time and continuing across reloads. It clamps at 23:59 Asia/Singapore on `TODAY`; the shell then offers demo reset to staff roles with demo controls. PIN lockouts expire no later than this clamp, and departures remain valid through 23:59 on the seeded day. The clock does not roll into the next date, so reset the demo to resume attendance work. Resetting demo data in Settings or the demo controls also resets this clock and restores the audit log seed before appending the reset event. Studio Platform uses the real school clock.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Today's class register and attendance history | Mark today's attendance; amend today's records for their own class with a reason |
| Reviewer / Principal | Attendance registers and history | Read only |
| School admin | All attendance registers, history and amendment trails | Mark and amend records, including past dates, with a reason for every amendment |
| Parent | No attendance data in this phase | None; Family Portal is Phase 3 |

Capabilities: `attendance.view` (teacher, reviewer, admin), `attendance.mark` (teacher, admin), and `attendance.amend` (admin; teacher only for today in their own class). Parent has none. Access is enforced by Studio Platform; the demo role switcher is not a security boundary.

## Flows

1. Teacher opens `/attendance`, selects their class register for today, reviews the summary strip, and marks a child Present (arrival defaults to now) or Absent (chooses a reason). Filters are All, Not marked, Present, Absent and Late. “Mark remaining present” requires confirmation.
2. A guardian uses `/attendance/kiosk`, a full-screen PIN / QR / Face kiosk without staff navigation. `/attendance/check-in` redirects to the kiosk. The kiosk has no Staff roster action; staff marking remains at `/attendance`. Demo PINs are fictional, deterministic, non-sequential values stored in clear text in session state for this demo only; lockout state and errors never contain a PIN. Studio Platform stores only salted PIN hashes. Three wrong attempts lock that code for five minutes. QR simulates a fictional card scan without camera access. Face is unavailable in the demo because face-match consent is not recorded and the school has not enabled it.
3. Admin opens `/attendance/history`, chooses a school day, reviews records and amendment trails, then amends a field with a required reason. Teachers can read past registers but cannot amend them. Selecting today links back to the live register.

The dashboard attendance tile is shown to teachers and admins only. Reviewers can read attendance from the attendance screens but do not see the dashboard tile.
4. Pick-up & Release calls `recordDeparture` when releasing a present child; Attendance alone owns departure time.

## Screens and states

- `/attendance`: today's class register, summary strip (present, late, absent, not marked), roster, Present / Absent actions, absence-reason dialog, arrival time defaulting to now, filters and confirmed bulk action. Show default, empty, loading, error, blocked-with-reason and read-only states.
- `/attendance/kiosk`: Full-screen PIN, QR and Face (unavailable placeholder) method tabs, a demo-mode banner, staff-only exit, and a collapsed fictional credentials disclosure. QR is a simulated scan; no camera permission or camera access.
- `/attendance/history`: date picker limited to seeded school days, read-only past view for teachers, admin amendment dialog with required reason and per-record amendment trail. Show loading, empty, error and blocked states.
- Teacher and admin dashboard tile links to today's register. Layouts cover desktop, tablet (≤1024, bottom tabs) and mobile (390).

## Rules

- `canMark` allows a first mark only for an active child enrolled in the class, for today's date in Asia/Singapore, never a future date. A first mark needs no reason. Any change to an existing record is an amendment and requires a reason.
- `isLate` derives lateness from the arrival's Asia/Singapore local time after the policy cut-off, default 08:30 (to confirm per school). Late is not a stored status.
- `validateRecord` requires no arrival or departure for absence; presence requires arrival; arrival cannot be after now; departure must be after arrival and no later than now.
- `canAmend` permits admins to amend past records and teachers to amend only today's record in their own class. Amendments require a 5–200 character reason stored only on the amendment.
- `visibleRegisterRows` excludes withdrawn children from today's register; withdrawn children appear in history only when they have a record. Their history remains readable.
- `recordDeparture` refuses absent or unmarked children and any second departure.
- `dailySummary` counts present, late, absent and not marked, plus absence counts by reason.
- `getCheckInMethods` leaves staff, PIN and QR available; face placeholder is available only if school-enabled and consent exists. Demo face method is unavailable with `consent-not-recorded` for every child.
- `checkInWithPin` locks a fictional child code after three wrong PIN attempts for five minutes. PIN values are never logged.
- Audit summaries use fixed translatable keys and contain no free-text reasons, notes, PINs or sensitive values.

## Compliance hooks

Daily attendance records support the licensee's obligations under ECDA requirements for attendance record keeping; exact fields and retention are to confirm. Arrival and departure times feed Pick-up & Release. Face-match is optional, consent-gated, never the only method, and the demo never captures or processes faces; this supports the licensee's obligations under PDPA purpose limitation. Consent remains owned by Privacy Centre. Retention periods and the exact record requirements are to confirm with the licensee.

## Data port

Reads: `getAttendanceRegister(classId, date, actor)`, `getAttendanceSummary(classId, date, actor)`, `getAmendments(recordId, actor)`, `getCheckInMethods(childId)`. Writes: `markPresent(childId, { arrivedAt, method }, actor)`, `markAbsent(childId, { reason }, actor)`, `markRemainingPresent(classId, actor)`, `amendAttendance(recordId, { field, to, reason }, actor)`, `recordDeparture(childId, departedAt, actor)`, `checkInWithPin(childCode, pin, atIso)`, `checkInWithQr(cardId, atIso)`. Writes return a typed `PortResult` refusal; parent and reviewer writes refuse with `not-permitted`.

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).

## Open items

- School lateness cut-off (default 08:30 Asia/Singapore) is **to confirm** per school.
- Exact ECDA attendance fields and retention period are **to confirm** with the licensee.
- Face-match enablement and consent workflow depend on Privacy Centre; no demo child has consent.
