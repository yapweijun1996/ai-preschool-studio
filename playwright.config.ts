import { defineConfig } from '@playwright/test';

// PW_CHROMIUM lets environments with a preinstalled browser skip the download.
const executablePath = process.env.PW_CHROMIUM || undefined;
// BASE_URL runs the suite against a deployed site (e.g. GitHub Pages) instead of a local build.
const remote = process.env.BASE_URL;
const visual = process.env.PW_VISUAL === '1';
// PW_PORT lets parallel runs (e.g. several worktrees) use separate preview servers.
const port = process.env.PW_PORT ?? '4173';

const optionalBrowsers = (process.env.PW_BROWSERS ?? '')
  .split(',')
  .map(browser => browser.trim())
  .filter(browser => browser === 'firefox' || browser === 'webkit');

export default defineConfig({
  testDir: 'e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  timeout: 30_000,
  // The live CDN can be briefly flaky; local runs must be deterministic, so no retries there.
  retries: remote ? 2 : 0,
  use: {
    baseURL: remote ?? `http://localhost:${port}/`,
    launchOptions: executablePath ? { executablePath } : {}
  },
  projects: [
    { name: 'chromium', testIgnore: '**/visual.spec.ts', use: { browserName: 'chromium' } },
    ...(visual ? [{
      name: 'visual',
      testMatch: '**/visual.spec.ts',
      use: { browserName: 'chromium' as const, viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' as const }
    }] : []),
    ...(optionalBrowsers.includes('firefox')
      ? [{ name: 'firefox', testIgnore: ['**/a11y.spec.ts', '**/visual.spec.ts'], use: { browserName: 'firefox' as const, viewport: { width: 1440, height: 900 } } }]
      : []),
    ...(optionalBrowsers.includes('webkit')
      ? [{ name: 'webkit', testIgnore: ['**/a11y.spec.ts', '**/visual.spec.ts'], use: { browserName: 'webkit' as const, viewport: { width: 1440, height: 900 } } }]
      : [])
  ],
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
