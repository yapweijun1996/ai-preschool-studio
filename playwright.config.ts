import { defineConfig } from '@playwright/test';

// PW_CHROMIUM lets environments with a preinstalled browser skip the download.
const executablePath = process.env.PW_CHROMIUM || undefined;
// BASE_URL runs the suite against a deployed site (e.g. GitHub Pages) instead of a local build.
const remote = process.env.BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: {
    baseURL: remote ?? 'http://localhost:4173/',
    launchOptions: executablePath ? { executablePath } : {}
  },
  webServer: remote
    ? undefined
    : {
        command: 'npm run build && npx vite preview --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 120_000
      }
});
