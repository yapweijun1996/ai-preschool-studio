# Module: Observations (Evidence)

- Tier: Core
- Owns: Observation records and their generated demo identifiers
- Reads: Student (Children & Classes; static fictional records), learning area, milestone and reporting period (Learning Framework)
- Status: done (v0.4.0)

## Purpose

Captures teacher-authored, fictional evidence for a student and makes it available to progress and portfolio screens. The current form has no photo-upload capability and does not provide a shared evidence review queue, media storage or server persistence.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Student observation form and evidence; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today the single demo user can add observations for fictional students and retry a simulated save failure. |
| Reviewer / Principal | Evidence in portfolio/report views; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no distinct reviewer permissions or review queue. |
| School admin | Evidence views; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no distinct admin permissions. |
| Parent | Evidence only through a future family experience; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no parent account or permission. |

Access is enforced by Studio Platform; the demo shows it with the role switcher. The role switcher is planned (roadmap Phase 0); today the demo has one user and no real roles.

## Flows

1. From a student's profile or Studio evidence panel, choose Add observation to open the student-specific form.
2. Select a date, learning area, milestone and enter evidence text; save validates the date range and a minimum 10 trimmed characters.
3. On success, the form shows the generated `OBS-xxxx` source ID and links to progress or Add another; on simulated failure, retry save.

## Screens and states

- Add observation: prefills the fixed demo date, Mathematics, Developing and sample text; form fields include date/domain/milestone/text. Date out of allowed Term 4 range and text shorter than 10 trimmed characters show inline errors and focus the first invalid field (`src/pages/AddObservation.tsx:34-72,141-197`).
- Save: editing/unsaved, saving, saved with source ID, and failed with retry are explicit states. Edited unsaved input registers a dirty guard, blocking PWA update/reload until saved or discarded (`src/pages/AddObservation.tsx:43-53,62-85,112-139`). `saveFail` is the demo simulation; no network save is attempted (`src/pages/AddObservation.tsx:74-84`).
- Missing student route renders NotFound (`src/pages/AddObservation.tsx:49-55`). There is no observation-list empty screen on this form; empty observation states appear in profile and studio.
- Desktop and tablet show the form with tips beside it; mobile uses the compact AppShell header/action bar (`src/pages/AddObservation.tsx:93-120,207-218`; `src/components/AppShell.tsx:412-470`).

## Rules

- `save` accepts dates from `TERM4_START` through the earlier of `TODAY` and `TERM4_END`, requires at least 10 trimmed text characters, prevents duplicate save while saving/saved, and exposes simulated save failure (`src/pages/AddObservation.tsx:60-84`).
- `reducer` assigns the next padded `OBS-xxxx` ID, derives term from the date, rejects dates outside every period without changing state, and increments the ID only after accepting the observation (`src/store/reducer.ts:81-91`).
- `termOf` maps a date to a configured reporting term; out-of-period dates return no term (`src/framework/index.ts:92-98`).
- `reducer` `addObservation` action accepts the `Observation` fields except generated `id`, then sets `id` and derives `term`; the record shape is `id, studentId, date, domain, text, milestone, hasPhoto, term` (`src/store/reducer.ts:26-28,81-91`; `src/data/demo.ts:22-31`). Seed data is fictional (`src/data/demo.ts:1,73-87,177-209`).
- `save` persists only through the in-memory reducer dispatch; photo upload and durable backend persistence are not implemented. Not in Studio Demo yet — planned (roadmap Phase 0 Data port; media capability to confirm) (`src/pages/AddObservation.tsx:62-84`; `src/store/reducer.ts:81-91`).

## Compliance hooks

No PDPA obligation is supported by this module in Studio Demo yet. Planned: consent, retention, access controls and audit events are addressed by roadmap Privacy Centre, Records Retention and Audit Log work. No child photos are collected by this screen.

## Data port

Proposed async interfaces:
- `getStudentSummary(studentId: string): Promise<StudentSummary | undefined>` (proposed; demo implementation: `studentSummary` `src/store/selectors.ts:15-27`)
- `getCurrentFramework(): Promise<Framework>` (proposed; demo implementation: `frameworkFor` `src/framework/index.ts:82-86`)
- `getPeriod(date: string): Promise<ReportingPeriod | undefined>` (proposed; demo implementation: `periodOf` `src/framework/index.ts:92-98`)

Writes:
- `addObservation(input): Promise<Observation>` (server assigns ID; demo: dispatch `{type:'addObservation', ...}` after the page computes `OBS-xxxx`; reducer derives term from date) (`src/pages/AddObservation.tsx:79`; `src/store/reducer.ts:81-91`)

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
