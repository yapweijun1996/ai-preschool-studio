# AI Preschool Studio

A teacher-first portfolio workspace for preschool teachers, built with React + Vite + TypeScript.
It is a working prototype of the "AI Preschool Studio v1" design system: every colour, type size,
radius and spacing value comes from `design/tokens.json` (mirrored in `src/styles/tokens.css`).

> **Demo mode.** All students, observations and reports are fictional sample data. The AI is a
> local **Mock provider** that returns canned text — no live AI, no network calls, no child photos.

## Journey

Dashboard → My Students → Student Profile → Add Observation → Learning Progress (Term 3 vs Term 4)
→ **AI Portfolio Studio** → Report Preview (A4) → Approve

- **AI Portfolio Studio** — Evidence | Narrative | AI Assistant. AI edits appear as a diff with
  Apply / Reject / Regenerate (Undo after apply). Every fact carries an `OBS-xxxx` source chip;
  sentences without evidence are flagged **Needs teacher verification**.
- **Report flow** — Draft → In review → Changes requested → Approved. Approve is blocked, with the
  reason shown, while any claim lacks evidence.
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
  collapses only the panel; the state persists. Top bar: theme menu (Light/Dark/System) and
  account menu. Phones use a bottom tab bar with a More sheet.
- **Responsive** — desktop ≥1200 (rail + context panel + 3 columns), tablet 768–1199 (rail,
  editor with a docked Evidence/AI drawer), mobile <768 (compact header, bottom tab bar,
  Evidence | Write | AI tabs, sticky action bar). Light and dark themes.
- **Languages** — English (default), 中文 (Simplified Chinese) and Bahasa Melayu. Switch from
  the top-bar language menu, the phone More sheet or Settings › Language; the choice persists
  and sets `<html lang>`. Learning domains stay bilingual with 中文. Teacher content
  (observations, narratives, reflections) stays in the language it was written in.
- **Installable app (PWA)** — manifest, icons and a versioned service worker. The app checks for
  a new release on start, when you return to the tab, when the network comes back and hourly.
  A new release shows **Update to vX.Y.Z** (top bar, sidebar footer, Settings › About); it
  installs with a loader and one reload. It updates by itself only while the tab is in the
  background and nothing is unsaved; it never reloads over a draft. Offline: the app shell and
  demo data keep working; the Mock provider runs locally.
- **Settings** — Appearance (Light/Dark/System, sidebar panel), Language, About & updates
  (version, build, update status, Check for updates), Demo data (simulate AI outage or save
  failure, reset).

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static site in dist/ (relative base, hash routing)
npm test             # unit tests (reducer, approval rules, Mock provider, i18n, PWA state machine)
npm run e2e          # Playwright: journey, sidebar, i18n, settings, real service-worker updates
npm run icons        # regenerate PWA icons (needs Chromium; see PW_CHROMIUM below)
```

If Chromium is already installed elsewhere, point Playwright at it:
`PW_CHROMIUM=/path/to/chrome npm run e2e`. `BASE_URL=<deployed url> npx playwright test
e2e/journey.spec.ts e2e/sidebar.spec.ts` runs the suite against a deployed site.

Version identity: `package.json` version + short commit SHA, baked in at build time and
published as `version.json`. Override with `APP_VERSION` / `BUILD_ID` env vars.

## Deploy (GitHub Pages)

`.github/workflows/deploy-pages.yml` runs on every push to `main` (and on demand from the
Actions tab): `npm ci` → `npm test` → `npm run build` → publishes `dist/` to GitHub Pages →
**live smoke**: waits until the live `version.json` reports this commit's build, then runs the
journey and sidebar e2e specs against the live URL.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is served at `https://yapweijun1996.github.io/ai-preschool-studio/`. Pages on a
private repository needs a paid GitHub plan; on the free plan, make the repo public first.

## Structure

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
