import { defineConfig } from '@playwright/test';

// PW_CHROMIUM lets environments with a preinstalled browser skip the download.
const executablePath = process.env.PW_CHROMIUM || undefined;
// BASE_URL runs the suite against a deployed site (e.g. GitHub Pages) instead of a local build.
const remote = process.env.BASE_URL;
// PW_PORT lets parallel runs (e.g. several worktrees) use separate preview servers.
const port = process.env.PW_PORT ?? '4173';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  // The live CDN can be briefly flaky; local runs must be deterministic, so no retries there.
  retries: remote ? 2 : 0,
  use: {
    baseURL: remote ?? `http://localhost:${port}/`,
    launchOptions: executablePath ? { executablePath } : {}
  },
  webServer: remote
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${port} --strictPort`,
        url: `http://localhost:${port}`,
        // Never reuse: another worktree's server would test the wrong build.
        reuseExistingServer: false,
        timeout: 120_000
      }
});
