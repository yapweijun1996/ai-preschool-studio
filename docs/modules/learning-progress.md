# Module: Learning Progress

- Tier: Core
- Owns: Derived student summaries and term-by-term milestone view
- Reads: Student (Children & Classes; static fictional records), observations (Observations), learning framework (Learning Framework), report and narrative claim state (Portfolio Studio / Report Review)
- Status: done (v0.4.0)

## Purpose

Shows observation-derived milestones, observation counts and changes between Term 3 and Term 4 for a student. The profile also links to observation entry, progress, portfolio and report preview. This module does not set milestones independently of evidence or provide analytics/rankings.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Student profiles and learning progress. | View progress, pin students, add observations and open/edit portfolios. |
| Reviewer / Principal | Student profiles and learning progress. | View progress and reports; Studio is read-only. |
| School admin | Read-only Students views; own landing lists planned admin modules. | View students; administration modules remain planned. |
| Parent | Planned-role landing page; no student navigation. | Family Portal is planned for Phase 3. |

Demo UI permissions are defined by [`src/roles/index.ts`](../../src/roles/index.ts). The role switcher is a display feature, not an access-control boundary; Studio Platform enforces real access.

## Flows

1. Open a student profile from Students or search; view Term 4 domain cards, recent observations and report status.
2. Choose Compare / Learning progress to view Term 3 and Term 4 milestones and linked observation IDs.
3. Select a domain card to open the matching progress row; choose Add observation or Open AI Portfolio Studio for the next action.

## Screens and states

- Student profile default: fictional student/class details, four domain cards, latest four Term 4 observations, report status, pinned control and links (`src/pages/StudentProfile.tsx:18-38,56-149`). Empty recent observations state provides Add observation (`src/pages/StudentProfile.tsx:99-118`); an individual domain with no observation shows no milestone and a no-observation label (`src/pages/StudentProfile.tsx:81-95`).
- Student profile claims warning appears when `sum.unverified > 0` and links to claim focus (`src/pages/StudentProfile.tsx:129-136`). No profile loading or save-error state is implemented.
- Learning progress default compares Term 3 and Term 4, shows milestone dots, counts, notes and Term 4 observation IDs (`src/pages/LearningProgress.tsx:27-54,56-129`). No observations are represented as null milestone / “Not yet observed”; comparison note can indicate first seen, unchanged or moved (`src/pages/LearningProgress.tsx:88-103`).
- Aria's change notes are hard-coded teacher-authored text, not computed from milestone changes; other cases use derived neutral notes (`src/pages/LearningProgress.tsx:16-25,94-102`).
- Unknown student route renders NotFound (`src/pages/StudentProfile.tsx:25-28`; `src/pages/LearningProgress.tsx:31-46`).
- The profile/progress pages use AppShell responsive layout and StudentTabs; progress focuses a domain row when routed with `?domain=` (`src/pages/LearningProgress.tsx:34-45,76-125`). Desktop/tablet/mobile are handled by shared shell and page breakpoints; no separately asserted 390px module state (`src/components/AppShell.tsx:368-533`).

## Rules

- `studentSummary(state,id)` returns undefined for an unknown student; otherwise derives Term 4 count, last observation date across terms and unverified claim count from current observations/reports (`src/store/selectors.ts:15-27`).
- `allSummaries(state)` returns a summary for each static student; `milestonesFor(state,id,term)` delegates to evidence-derived milestones (`src/store/selectors.ts:29-38`).
- `milestonesFrom(observations,studentId,term)` picks the latest dated observation per domain in that term and returns null if none exists (`src/store/reducer.ts:229-241`).
- `observationsFor(state,studentId,term)` selects observations for the student and term, defaulting to Term 4 (`src/store/reducer.ts:243-245`).
- `StudentProfile` and `LearningProgress` render evidence-derived milestones without calculating scores, percentages or rankings (`src/pages/StudentProfile.tsx:81-95`; `src/pages/LearningProgress.tsx:77-125`).

## Compliance hooks

No PDPA obligation is supported by this module in Studio Demo yet. Planned: consent, retention and audit-event mechanisms are addressed by roadmap Privacy Centre, Records Retention and Audit Log work.

## Data port

Proposed async interfaces:
- `getStudentSummary(studentId: string): Promise<StudentSummary | undefined>` (proposed; demo implementation: `studentSummary` `src/store/selectors.ts:15-27`)
- `getAllSummaries(): Promise<StudentSummary[]>` (proposed; demo implementation: `allSummaries` `src/store/selectors.ts:29-31`)
- `getMilestones(studentId: string, term?: 3 | 4): Promise<Record<DomainKey, Milestone | null>>` (proposed; demo implementation: `milestonesFor` `src/store/selectors.ts:33-38`)
- `getObservations(studentId: string, term?: 3 | 4): Promise<Observation[]>` (proposed; demo implementation: `observationsFor` `src/store/reducer.ts:243-245`)

Writes: none in this module. Add observation and portfolio/report actions are owned by their respective modules.

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
