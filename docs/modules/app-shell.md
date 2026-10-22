# Module: App Shell, i18n & PWA

- Tier: Platform
- Owns: Shared navigation/layout, theme and language preference, shell panel state, global search, service-worker update UI
- Reads: Student summaries and report status (Children & Classes / Report Review), observations (Observations), framework labels (Learning Framework), PWA service-worker/version state
- Status: exists

## Purpose

Provides shared navigation, responsive shell, settings, search, language/theme controls, local navigation memory and installable-app update handling. It does not provide account security, real role permissions, server-backed settings or a production backend.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Teacher portfolio navigation, search, settings and update status; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today the single demo user can navigate all demo screens, search students/pages, change theme/language and manage demo controls. |
| Reviewer / Principal | Reviewer portfolio navigation; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no role-based navigation or access restrictions. |
| School admin | Admin screens in a future design; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no school-admin screens or permissions. |
| Parent | Family screens in a future design; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no parent account or permissions. |

Access is enforced by Studio Platform; the demo shows it with the role switcher. The role switcher is planned (roadmap Phase 0); today the demo has one user and no real roles.

## Flows

1. Navigate via desktop icon rail and context panel, or bottom tabs and More sheet at widths ≤1024px; panel toggle persists outside focus mode.
2. Search student names or Dashboard/Students/Settings with Ctrl/⌘+K; arrows select, Enter navigates and Escape closes/restores focus.
3. Change theme (Light/Dark/System) or language (English/中文/BM) from shell menus or Settings.
4. Check for an app update; review version/status, apply when safe, or retry a failed check/install.
5. In Settings, view About/update status, read framework, adjust language/appearance and toggle/reset demo failure controls.

## Screens and states

- Desktop ≥1025: top bar, rail, contextual module panel, breadcrumb, global search, theme/language/account menus. Sidebar panel persists in `aps-panel-open`; Studio focus mode opens with it closed and its open/close state is not persisted (`src/components/AppShell.tsx:37-53,368-406,472-529`).
- Tablet ≤1024: bottom tab bar with More sheet; tablet layouts retain content and use panel overlay where applicable (`src/components/AppShell.tsx:295-326,368-470`).
- Mobile: compact header, bottom tabs, More sheet, update banner and optional sticky screen action bar (`src/components/AppShell.tsx:412-444`).
- Global Search: closed/open palette, matching students/pages, empty query/no match, active result and keyboard navigation; selection closes and restores trigger focus (`src/components/GlobalSearch.tsx:18-20,22-32,54-93`).
- Language: English default, 中文 and Bahasa Melayu; selection is shared with Settings and updates app language through i18n (`src/components/AppShell.tsx:88-120`; `src/pages/Settings.tsx:100-120`). Domain labels remain bilingual via framework labels (`src/i18n/labels.ts:5-24`).
- Settings sections: Appearance, Language, Learning framework, About and Demo data; invalid section routes show NotFound (`src/components/ModulePanel.tsx:13-21`; `src/pages/Settings.tsx:295-338`). Framework is read-only (`src/pages/Settings.tsx:216-255`). Demo controls toggle simulated AI/save failure and reset fictional state (`src/pages/Settings.tsx:258-292`).
- PWA states include unsupported, checking/current, offline, update available, update applying, check/registration error and install error; Retry is offered for failed check/registration and install (`src/pwa/index.tsx:98-104,290-319,332-354`; `src/components/AppShell.tsx:192-293`). Update button shows known version or Update now; apply is guarded against unsaved work; failures leave pending updates available (`src/components/AppShell.tsx:192-293`; `src/pwa/index.tsx:321-354,418-429`).
- No app-shell backend loading or settings-save failure is implemented. Demo data is local; session storage failure falls back to in-memory state (`src/store/PortfolioContext.tsx:34-54`).

## Rules

- `AppShell` uses bottom tab navigation at mobile and tablet widths through 1024px; desktop uses rail/context panel (`src/components/AppShell.tsx:368-470`).
- `AppShell` focus mode keeps a separate transient panel state; regular desktop panel state uses `readPanelOpen`/`writePanelOpen` (`src/components/AppShell.tsx:37-53,380-393`).
- `GlobalSearch` lists matching students and three fixed pages and supports keyboard navigation with focus restoration (`src/components/GlobalSearch.tsx:10-14,18-20,63-89`).
- `ModulePanel` shows pinned and recent students locally, limits recent to five and excludes pinned entries (`src/components/ModulePanel.tsx:36-65`).
- `LanguageItems` exposes English, Chinese and Malay language options; framework names are sourced from `useLabels` (`src/components/AppShell.tsx:88-120`; `src/i18n/labels.ts:9-24`).
- `PwaProvider` checks on startup, tab visibility, network return and hourly; calls share an in-flight check (`src/pwa/index.tsx:290-319,390-416`).
- `shouldAutoApply` only triggers automatic application when tab is hidden and no dirty work exists (`src/pwa/index.tsx:418-429`). Manual `applyUpdate` also refuses while dirty and has duplicate/reload guards (`src/pwa/index.tsx:332-354`).
- `useDirtyGuard` registers unsaved work and PWA provider warns before unload (`src/pwa/index.tsx:161-185,480-487`).
- PWA registration/update errors distinguish check/install paths and can be retried; app-shell update UI is in `UpdateButton`, `UpdateOverlay` and `UpdateError` (`src/components/AppShell.tsx:192-293`).

## Compliance hooks

Language, accessibility affordances and update controls support the licensee's obligations under PDPA (Singapore) and ECDA by making shared screens usable and keeping update behavior visible; this is a design reference, not a compliance claim. User authentication, role enforcement, consent, retention, audit events and production incident handling are not implemented. Not in Studio Demo yet — planned (roadmap Phase 0 role switcher; Phase 4 Privacy Centre and Records Retention; Phase 1 audit events).

## Data port

Reads:
- `getAllSummaries(state: State): StudentSummary[]` (`src/store/selectors.ts:29-31`; GlobalSearch)
- `getStudentSummary(state: State, id: string): StudentSummary | undefined` (`src/store/selectors.ts:15-27`; ModulePanel)
- `getShellUpdateState(): PwaApi` with status/version/error/updateOffered/hasDirtyWork/checkNow/applyUpdate (`src/pwa/index.tsx:37-58,431-447`)
- `getCurrentLanguage(): Lang` and framework labels through `useLabels(version?)` (`src/i18n/labels.ts:9-24`)

Writes:
- `setDemoState(key: 'aiDown' | 'saveFail', value: boolean): void` (reducer action `setSim`; `src/store/reducer.ts:26-39,168-171`)
- `resetDemoState(): void` (reducer action `reset`; `src/store/reducer.ts:26-39,170-171`)
- `setLanguage(lang: Lang): void` and `setTheme(theme: 'light' | 'dark' | 'system'): void` (UI preference APIs; `src/pages/Settings.tsx:73-120`; provider implementation is in i18n/theme modules)
- `checkForUpdate(): Promise<void>` / `applyUpdate(): void` (`src/pwa/index.tsx:431-447`)

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
