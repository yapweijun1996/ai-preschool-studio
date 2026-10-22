# Module: Learning Framework

- Tier: Core
- Owns: Learning areas, milestone scale, reporting periods, framework versions
- Reads: None
- Status: done (2026.1)

## Purpose

Provides the single versioned vocabulary for learning areas, milestones and reporting periods used across the demo. Settings presents it read-only; this module does not let users configure the framework or verify the external NEL mapping.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Framework labels and Settings › Learning framework; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today the single demo user can view framework and use its labels in observation, progress, studio and report screens. |
| Reviewer / Principal | Framework labels and Settings › Learning framework; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no separate reviewer permission exists. |
| School admin | Framework labels and Settings › Learning framework; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no separate admin permission exists. |
| Parent | Framework labels in the planned family experience; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no parent account or permission exists. |

Access is enforced by Studio Platform; the demo shows it with the role switcher. The role switcher is planned (roadmap Phase 0); today the demo has one user and no real roles.

## Flows

1. View the framework: Settings › Learning framework shows the current version, areas and NEL mappings, milestone scale and reporting periods; no edit action is offered.
2. Consume framework labels: observation, progress, studio and report screens obtain domain, milestone and period labels through `useLabels`.
3. Preserve approved vocabulary: approval records the framework version and milestones; report rendering uses that version's labels.

## Screens and states

- Settings › Learning framework: versioned default; no empty, loading, save-failed or blocked state because framework values are static; read-only notice and area mapping, scale and periods (`src/pages/Settings.tsx:216-255`). Invalid Settings section routes to NotFound (`src/pages/Settings.tsx:329-336`).
- Labels and period helpers: current language labels, including English, 中文 and BM; `frameworkFor` falls back to current version for an unknown or absent version (`src/framework/index.ts:82-98`; `src/i18n/labels.ts:9-24`).
- Desktop/tablet/mobile shell layouts are provided by AppShell; Settings page section navigation changes at non-desktop breakpoints (`src/components/AppShell.tsx:368-533`; `src/pages/Settings.tsx:295-325`). No framework-specific mobile 390 treatment is implemented separately.

## Rules

- `frameworkFor(version)` returns the configured framework, whose current version is `2026.1` with four stable domain keys, three milestones and Term 3/4 periods (`src/framework/index.ts:56-86`).
- `frameworkFor(version)` selects a published version, falling back to current when the version is absent or unknown (`src/framework/index.ts:82-86`).
- `periodOf(date)` returns a period only when the date falls inclusively within its configured start and end (`src/framework/index.ts:92-98`).
- `useLabels(frameworkVersion)` resolves area, milestone, period and NEL labels in the selected language (`src/i18n/labels.ts:9-24`).
- `FrameworkSection` renders the framework read-only (`src/pages/Settings.tsx:216-255`).
- `useLabels` resolves labels for the NEL learning-area mapping; whether each mapping matches official NEL documents is to confirm (`src/i18n/labels.ts:21-22`; `src/framework/index.ts:9-13`).

## Compliance hooks

Framework vocabulary and version retention support the licensee's obligations under ECDA by making the learning areas and progress basis explicit. The exact ECDA alignment of the NEL mappings is to confirm. No consent, retention policy or audit-event mechanism is implemented here; Not in Studio Demo yet — planned (roadmap Phase 4) for Records Retention and Privacy Centre; audit events are planned with Report Release & History in roadmap Phase 1.

## Data port

Reads:
- `getCurrentFramework(): Framework` (`src/framework/index.ts:47-54, 82-84`)
- `getFramework(version?: string): Framework` (`src/framework/index.ts:82-86`)
- `getPeriod(date: string): ReportingPeriod | undefined` (`src/framework/index.ts:92-98`)

Writes: none. Framework configuration is static and read-only in the demo.

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
