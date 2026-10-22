# Visual regression

Playwright captures the component catalog sections and selected dashboard, student, report, and
settings screens in fixed desktop and mobile viewports. The `visual` project is opt-in: set
`PW_VISUAL=1` with `npm run test:visual` to run it. The normal Playwright suite does not include
visual tests. CI runs against Chromium on Ubuntu and allows a maximum differing pixel ratio of
0.01.

The visual fixture fixes browser time at 2026-10-22 09:00 +08:00 and pins the browser timezone to
Asia/Singapore with locale `en-SG`, matching the demo market so date and time formatting is stable
across host timezones. It clears browser storage in each fresh context and sets English plus the
requested theme, blocks service workers so update banners
cannot arrive during capture, and waits for `document.fonts.ready`. The demo's relative dates
already use a fixed `TODAY` value. Latin text uses self-hosted Inter; Chinese text uses native
operating-system CJK fonts from the token stack. Screenshots mask the context-panel build/version footer because the commit SHA changes
between builds.

## Updating baselines

The initial baselines were committed at `f0e0b6d` (57 PNGs). Whenever a UI change is intended,
regenerate them by running the **Visual regression** GitHub Actions workflow via
`workflow_dispatch` with `update=true`. This branch changes the report and audit UI, so its
baselines will be regenerated before merge. The workflow captures fresh
screenshots and uploads them as the `visual-baselines` artifact. Download and extract that artifact
at the repository root, review the image changes, and commit the files under
`e2e/__screenshots__/visual.spec.ts/` with the corresponding UI change. Pull requests and pushes
to `main` compare against those committed files. If the folder is absent, CI reports that the
comparison was skipped so the first baseline capture can happen without failing the pipeline.

Baselines are CI-only: capture and comparison use the same official Playwright `v1.56.0-noble`
container and Chromium version, avoiding
native CJK font and rendering differences across developer operating systems. Do not auto-commit or push
baselines from CI. To capture locally for investigation, use `npm run test:visual:update`; remove
the generated PNGs before committing source changes.
