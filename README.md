# AI Preschool Studio

A teacher-first portfolio workspace for preschool teachers, built with React + Vite + TypeScript.
It is a working prototype of the "AI Preschool Studio v1" design system: every colour, type size,
radius and spacing value comes from `design/tokens.json` (mirrored in `src/styles/tokens.css`).

**Edition: Studio Demo** — the teacher portfolio loop with fictional data and a Mock provider.
School operations, family portal and administration belong to the separate Studio Platform
edition; see [ADR 0001](docs/adr/0001-two-editions.md). Studio Demo is the production design
reference that Studio Platform can copy or port ([ADR 0002](docs/adr/0002-production-design-reference.md),
[roadmap](docs/roadmap.md), [data port guide](docs/data-port.md)).

> **Demo mode.** All students, observations and reports are fictional sample data. The AI is a
> local **Mock provider** that returns canned text — no live AI, no network calls, no child photos.

## Journey

Dashboard → My Students → Student Profile → Add Observation → Learning Progress (Term 3 vs Term 4)
→ **AI Portfolio Studio** → Report Preview (A4) → Approve

- **AI Portfolio Studio** — Evidence | Narrative | AI Assistant. AI edits appear as a diff with
  Apply / Reject / Regenerate (Undo after apply). Every fact carries an `OBS-xxxx` source chip;
  sentences without evidence are flagged **Needs teacher verification**.
- **Report flow** — Draft → In review → Changes requested → Approved. A report goes to review
  only when all four domains are written and the teacher reflection is added; Approve is also
  blocked, with the reason shown, while any claim lacks evidence. The "Before approval" checks
  are computed from the report's real content.
- **Learning framework** — `src/framework` is the single owner of learning areas (stable keys,
  bilingual labels in en/中文/BM, each mapped to an NEL 2022 learning area or core competency —
  a demo mapping still to be confirmed), the milestone scale
  and reporting periods. Every page reads it; Settings › Learning framework shows it read-only.
  It is versioned: an approved report records the version and keeps its labels.
- **Demo data** — 20 fictional students in K2 Sunflower. Observation counts, last-observed dates
  and every milestone are derived from the observation records (a domain's milestone is the one on
  its latest observation; no observation → "Not yet observed"). A not-started report can start a
  draft from the child's own observations (fixed template, not AI).
- **Domains** are always bilingual: English 英语, Chinese 华语, Mathematics 数学,
  Social-Emotional 社交与情绪发展. Milestones are dots + words (Emerging / Developing /
  Consistently demonstrated) — no scores, percentages or rankings.
- **States** — loading (students list, AI), empty (no observations, no filter match), save failed
  (reflection autosave, Add observation), AI unavailable, approval blocked. Use **More → Demo
  controls** to simulate AI outage or save failure, or to reset demo data.
- **Navigation** — ChatGPT-style two-level sidebar: 64px icon rail (Dashboard, Students,
  Observations, Reports, More) with hover/focus tooltips and an active marker, plus a 260px
  context panel whose content follows the module (class, report queue, latest observations),
  with student search, Pinned and Recent (last 5 opened). The toggle — or Ctrl/Cmd+Shift+S —
  collapses only the panel; the state persists. The AI Portfolio Studio opens in focus mode with
  the panel closed (opening it there is not saved). Top bar: theme menu (Light/Dark/System) and
  account menu, a breadcrumb trail and global search (Ctrl/⌘+K: students and pages).
  Phones and tablets up to 1024px use a bottom tab bar with a More sheet.
- **Responsive** — desktop ≥1200 (rail + context panel + 3 columns; pages are fluid and
  fill the width), tablet 768–1199 (editor with a docked Evidence/AI drawer; bottom tab bar up to
  1024px, rail + overlay panel from 1025px), mobile <768 (compact header, bottom tab bar,
  Evidence | Write | AI tabs, sticky action bar). Light and dark themes.
- **Languages** — English (default), 中文 (Simplified Chinese) and Bahasa Melayu. Switch from
  the top-bar language menu, the phone More sheet or Settings › Language; the choice persists
  and sets `<html lang>`. Learning domains stay bilingual with 中文. Teacher content
  (observations, narratives, reflections) stays in the language it was written in.
- **Installable app (PWA)** — manifest, icons and a versioned service worker. The app checks for
  a new release on start, when you return to the tab, when the network comes back and hourly.
  A new release shows **Update to vX.Y.Z** (top bar, sidebar footer, Settings › About; **Update
  now** if its version can't be read); it installs with a loader and one reload. It updates by
  itself only while the tab is in the background and nothing is unsaved; it never reloads over a
  draft. A failed check (or service-worker registration) offers Retry; a failed install says so
  and keeps the update on offer. Offline: the app shell and
  demo data keep working; the Mock provider runs locally.
- **Settings** — Appearance (Light/Dark/System, sidebar panel), Language, About & updates
  (version, build, update status, Check for updates), Demo data (simulate AI outage or save
  failure, reset).

Quality baseline: [2026-10-22](docs/quality/baseline-2026-10-22.md).

Visual regression: [how it works and how to update baselines](docs/quality/visual-regression.md).

Performance budgets: [Lighthouse CI budgets and reports](docs/quality/performance.md).

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static site in dist/ (relative base, hash routing)
npm test             # unit tests (reducer, approval rules, Mock provider, i18n, PWA state machine)
npm run e2e          # Playwright: journey, sidebar, profile, navigation, polish, all-students data, i18n, settings, real service-worker updates
npm run icons        # regenerate PWA icons (needs Chromium; see PW_CHROMIUM below)
```

If Chromium is already installed elsewhere, point Playwright at it:
`PW_CHROMIUM=/path/to/chrome npm run e2e`. `BASE_URL=<deployed url> npx playwright test
e2e/journey.spec.ts e2e/sidebar.spec.ts e2e/profile.spec.ts e2e/navigation.spec.ts e2e/polish.spec.ts e2e/students-data.spec.ts e2e/framework.spec.ts` runs the suite against a deployed site.

Version identity: `package.json` version + short commit SHA, baked in at build time and
published as `version.json`. Override with `APP_VERSION` / `BUILD_ID` env vars.

## Deploy (GitHub Pages)

`.github/workflows/deploy-pages.yml` runs on every push to `main` (and on demand from the
Actions tab): `npm ci` → `npm test` → `npm run build` → publishes `dist/` to GitHub Pages →
**live smoke**: waits until the live `version.json` reports this commit's build, then runs the
journey, sidebar, profile, navigation, polish, students-data and framework e2e specs against the live URL.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is served at `https://yapweijun1996.github.io/ai-preschool-studio/`. Pages on a
private repository needs a paid GitHub plan; on the free plan, make the repo public first.

## Structure

Brand mark and illustration rules, exact image prompts, and asset workflow: [docs/brand.md](docs/brand.md). The [component catalog guide](docs/catalog.md) covers the Brand and Illustrations catalog sections.

Font credits: Inter by Rasmus Andersson and Noto Sans SC by Google, both distributed under the SIL Open Font License 1.1.

```
design/tokens.json        design system tokens (source of truth)
src/styles/tokens.css     tokens as CSS variables, light + dark
src/styles/app.css        token-only component and layout styles
src/components/           AppShell, Icon, Menu, ModulePanel, shared UI, studio/ panels
src/i18n/                 provider, glossary labels, locales/{en,zh,ms}/{common,shell,pages}.ts
src/pwa/                  update state machine, provider, service-worker template
public/                   manifest + icons
src/pages/                one file per route
src/store/                pure reducer + selectors, React context
src/services/mockProvider.ts   Mock AI provider (canned, sourced suggestions)
src/data/demo.ts          fictional demo data
tests/                    Vitest unit tests
e2e/                      Playwright journey tests
```

## Rules this codebase keeps

- Tokens only: no raw colours, radii or shadows outside `tokens.css`.
- One primary action per region; every control is at least 44px; visible 2px focus ring.
- Status is never colour alone — always an icon and a word.
- The AI never edits text directly; it only proposes diffs the teacher applies.
- No parent portal, face recognition or admin-heavy screens.
