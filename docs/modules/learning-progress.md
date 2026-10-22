# Module: Learning Progress

- Tier: Core
- Owns: Derived student summaries and term-by-term milestone view
- Reads: Student (Children & Classes; static fictional records), observations (Observations), learning framework (Learning Framework), report and narrative claim state (Portfolio Studio / Report Review)
- Status: exists

## Purpose

Shows observation-derived milestones, observation counts and changes between Term 3 and Term 4 for a student. The profile also links to observation entry, progress, portfolio and report preview. This module does not set milestones independently of evidence or provide analytics/rankings.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Student profile and learning progress; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today the single demo user can view profiles/progress, pin students, add observations and open the portfolio. |
| Reviewer / Principal | Student profile and progress; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no distinct reviewer permissions. |
| School admin | Student profile and progress; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no distinct admin permissions. |
| Parent | Family-facing progress; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no parent account or permission. |

Access is enforced by Studio Platform; the demo shows it with the role switcher. The role switcher is planned (roadmap Phase 0); today the demo has one user and no real roles.

## Flows

1. Open a student profile from Students or search; view Term 4 domain cards, recent observations and report status.
2. Choose Compare / Learning progress to view Term 3 and Term 4 milestones and linked observation IDs.
3. Select a domain card to open the matching progress row; choose Add observation or Open AI Portfolio Studio for the next action.

## Screens and states

- Student profile default: fictional student/class details, four domain cards, latest four observations, report status, pinned control and links (`src/pages/StudentProfile.tsx:18-38,56-149`). Empty recent observations state provides Add observation (`src/pages/StudentProfile.tsx:99-118`); an individual domain with no observation shows no milestone and a no-observation label (`src/pages/StudentProfile.tsx:81-95`).
- Student profile claims warning appears when `sum.unverified > 0` and links to claim focus (`src/pages/StudentProfile.tsx:129-136`). No profile loading or save-error state is implemented.
- Learning progress default compares Term 3 and Term 4, shows milestone dots, counts, notes and source IDs (`src/pages/LearningProgress.tsx:27-54,56-129`). No observations are represented as null milestone / “Not yet observed”; comparison note can indicate first seen, unchanged or moved (`src/pages/LearningProgress.tsx:88-103`).
- Unknown student route renders NotFound (`src/pages/StudentProfile.tsx:25-28`; `src/pages/LearningProgress.tsx:31-46`).
- The profile/progress pages use AppShell responsive layout and StudentTabs; progress focuses a domain row when routed with `?domain=` (`src/pages/LearningProgress.tsx:34-45,76-125`). Desktop/tablet/mobile are handled by shared shell and page breakpoints; no separately asserted 390px module state (`src/components/AppShell.tsx:368-533`).

## Rules

- `studentSummary(state,id)` returns undefined for an unknown student; otherwise derives Term 4 count, last observation date across terms and unverified claim count from current observations/reports (`src/store/selectors.ts:15-27`).
- `allSummaries(state)` returns a summary for each static student; `milestonesFor(state,id,term)` delegates to evidence-derived milestones (`src/store/selectors.ts:29-38`).
- `milestonesFrom(observations,studentId,term)` picks the latest dated observation per domain in that term and returns null if none exists (`src/store/reducer.ts:229-241`).
- `observationsFor(state,studentId,term)` selects observations for the student and term, defaulting to Term 4 (`src/store/reducer.ts:243-245`).
- Profile cards and comparison do not calculate scores, percentages or rankings (`src/pages/StudentProfile.tsx:81-95`; `src/pages/LearningProgress.tsx:77-125`).

## Compliance hooks

Evidence-linked progress supports the licensee's obligations under ECDA by showing the basis for reported milestones. Fictional records support the licensee's obligations under PDPA (Singapore) only as a design reference; real consent, retention, access controls and audit events are not implemented. Not in Studio Demo yet — planned (roadmap Phase 4 Privacy Centre and Records Retention; audit events planned with Report Release & History in Phase 1).

## Data port

Reads:
- `getStudentSummary(state: State, id: string): StudentSummary | undefined` (`src/store/selectors.ts:5-27`)
- `getAllSummaries(state: State): StudentSummary[]` (`src/store/selectors.ts:29-31`)
- `getMilestones(state: State, id: string, term?: 3 | 4): Record<DomainKey, Milestone | null>` (`src/store/selectors.ts:33-38`)
- `getObservations(state: State, studentId: string, term?: 3 | 4): Observation[]` (`src/store/reducer.ts:243-245`)

Writes:
- None in this module. Add observation and portfolio/report actions are owned by their respective modules.

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
