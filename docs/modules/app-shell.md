# Module: App Shell, i18n & PWA

- Tier: Platform
- Owns: Shared navigation/layout, theme and language preference, shell panel state, global search, service-worker update UI
- Reads: Student summaries and report status (Children & Classes / Report Review), observations (Observations), framework labels (Learning Framework), PWA service-worker/version state
- Status: done (v0.4.0)

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

1. At widths ≥1200px navigate via desktop icon rail and context panel; at 1025–1199px the context panel overlays behind a scrim and is not persisted. At ≤1024px use bottom tabs and More sheet; panel is absent.
2. Search students or Dashboard/Students/Settings with Ctrl/⌘+K where global search is available; arrows select, Enter navigates and Escape closes/restores trigger focus.
3. Change theme (Light/Dark/System) or language (English/中文/BM) from shell menus or Settings.
4. Check for an app update; review version/status, apply when safe, or retry a failed check/install.
5. In Settings, view About/update status, read framework, adjust language/appearance and toggle/reset demo failure controls.

## Screens and states

- Desktop ≥1200: top bar, rail, contextual module panel, breadcrumb, global search, theme/language/account menus. Sidebar panel persists in `aps-panel-open`; Studio focus mode opens with it closed and its open/close state is not persisted (`src/components/AppShell.tsx:37-53,368-406,472-529`).
- Tablet 768–1199: at 1025–1199 the shell has a rail and context panel overlay behind a scrim; overlay state is not persisted. At 768–1024 use bottom tabs and More sheet; no context panel (`src/hooks/useBreakpoint.ts:9-15`; `src/components/AppShell.tsx:447-470,472,518-523`).
- Mobile <768: compact header, bottom tabs, More sheet, update banner and optional sticky screen action bar; no global search or Ctrl/⌘+K, and language menu is in More (`src/components/AppShell.tsx:315-321,412-444`).
- Global Search: closed/open palette, matching students/pages, empty query/no match, active result and keyboard navigation; selection navigates without restoring trigger focus; Escape and scrim close and restore focus (`src/components/GlobalSearch.tsx:18-20,22-32,63-70`).
- Settings sections: Appearance, Language, Learning framework, About and Demo data; invalid section routes show NotFound (`src/components/ModulePanel.tsx:13-21`; `src/pages/Settings.tsx:295-338`). Framework is read-only (`src/pages/Settings.tsx:216-255`). Demo controls toggle simulated AI/save failure and reset fictional state (`src/pages/Settings.tsx:258-292`).
- PWA states include unsupported, checking/current, offline, update available, update applying, check/registration error and install error; Retry is offered for failed check/registration and install (`src/pwa/index.tsx:98-104,290-319,332-354`; `src/components/AppShell.tsx:192-293`). Update button shows known version or Update now; apply is guarded against unsaved work; failures leave pending updates available (`src/components/AppShell.tsx:192-293`; `src/pwa/index.tsx:321-354,418-429`).
- No app-shell backend loading or settings-save failure is implemented. Demo data is local; session storage failure falls back to in-memory state (`src/store/PortfolioContext.tsx:34-54`).

## Rules

- `AppShell` uses bottom tabs at widths ≤1024px; no context panel at those widths. At 1025–1199 the panel is a non-persisted overlay; at ≥1200 desktop rail/context panel is used (`src/hooks/useBreakpoint.ts:9-15`; `src/components/AppShell.tsx:447-470,472,518-523`).
- `AppShell` focus mode keeps a separate transient panel state; regular desktop panel state uses `readPanelOpen`/`writePanelOpen` (`src/components/AppShell.tsx:37-53,380-393`).
- `GlobalSearch` lists matching students and three fixed pages; selection navigates; Escape/scrim restore trigger focus (`src/components/GlobalSearch.tsx:10-14,18-20,63-70`).
- `ModulePanel` reads `STUDENTS`, `state.reports` and `state.observations` directly (`src/components/ModulePanel.tsx:23,62-65`). Proposed port: `getStudentSummary(studentId: string): Promise<StudentSummary | undefined>` (proposed; demo implementation: `studentSummary` `src/store/selectors.ts:15-27`), plus port reads for pinned/recent students and report/observation counts.
- `PwaProvider` checks on startup, tab visibility, network return and hourly; calls share an in-flight check (`src/pwa/index.tsx:290-319,390-416`).
- `shouldAutoApply` only triggers automatic application when tab is hidden and no dirty work exists; `index.tsx` invokes it (`src/pwa/machine.ts:81-83`; `src/pwa/index.tsx:427-429`). Manual `applyUpdate` also refuses while dirty and has duplicate/reload guards (`src/pwa/index.tsx:332-354`).
- `useDirtyGuard` registers unsaved work and PWA provider warns before unload (`src/pwa/index.tsx:161-185,480-487`).
- PWA registration/update errors distinguish check/install paths and can be retried; app-shell update UI is in `UpdateButton`, `UpdateOverlay` and `UpdateError` (`src/components/AppShell.tsx:192-293`).

## Compliance hooks

No PDPA obligation is supported by this module in Studio Demo yet. Planned: consent, role enforcement, retention, audit events and incident handling are addressed by the roadmap's role switcher, Privacy Centre, Records Retention and Audit Log work.

## Data port

Proposed async data interfaces:
- `getAllSummaries(): Promise<StudentSummary[]>` (proposed; demo implementation: `allSummaries` `src/store/selectors.ts:29-31`)
- `getStudentSummary(studentId: string): Promise<StudentSummary | undefined>` (proposed; demo implementation: `studentSummary` `src/store/selectors.ts:15-27`)
- Module panel reads for pinned/recent students and report/observation counts (proposed; demo currently reads `STUDENTS`, `state.reports`, `state.observations` directly; `src/components/ModulePanel.tsx:23,62-65`)

## Shell runtime APIs (not data port)

- PWA runtime: `PwaApi.checkNow(): Promise<void>` and `applyUpdate(): void` (`src/pwa/index.tsx:37-58`).
- i18n runtime: `useI18n()` exposes `lang`, `setLang`, translations and locale formatting (`src/i18n/index.tsx:48-56,98-102`).
- Theme runtime: `useTheme()` exposes `pref`, `theme`, `setPref` (`src/hooks/useTheme.ts:20-42`).

Settings writes:
- `setDemoState(key: 'aiDown' | 'saveFail', value: boolean): void` (demo reducer action `setSim`; `src/store/reducer.ts:26-39,168-171`)
- `resetDemoState(): void` (demo reducer action `reset`; `src/store/reducer.ts:26-39,170-171`)

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
