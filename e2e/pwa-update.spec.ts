import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

// Real service worker, two real releases. Builds live under test-results/ (git-ignored) and are
// served by scripts/serve-switch.mjs under /ai-preschool-studio/ to mirror GitHub Pages.
const port = Number(process.env.PW_SWITCH_PORT || 4180);
const origin = `http://127.0.0.1:${port}`;
const appUrl = `${origin}/ai-preschool-studio/`;
const outRoot = 'test-results/pwa-builds';
const releases = {
  a: { version: '0.3.0-a', build: 'aaaaaaa' },
  b: { version: '0.3.0-b', build: 'bbbbbbb' }
} as const;

test.describe.configure({ mode: 'serial' });
test.use({ baseURL: appUrl, viewport: { width: 1280, height: 800 } });

let server: ChildProcess | undefined;

const switchTo = async (to: 'a' | 'b' | 'off') => {
  const res = await fetch(`${origin}/__switch?to=${to}`, { method: 'POST' });
  expect(res.ok).toBe(true);
};

type Snapshot = { status: string; currentVersion: string; currentBuild: string; availableVersion?: string; hasDirtyWork: boolean };
const snap = (page: Page) =>
  page.evaluate(() => (window as unknown as { __apsPwa: { snapshot(): Snapshot } }).__apsPwa.snapshot());

const waitForController = (page: Page) =>
  page.waitForFunction(() => !!navigator.serviceWorker && navigator.serviceWorker.controller !== null);

test.beforeAll(async () => {
  test.setTimeout(240_000);
  for (const [name, r] of Object.entries(releases)) {
    execFileSync(
      process.execPath,
      ['node_modules/vite/bin/vite.js', 'build', '--outDir', `${outRoot}/${name}`, '--emptyOutDir', '--logLevel', 'warn'],
      { env: { ...process.env, APP_VERSION: r.version, BUILD_ID: r.build }, stdio: 'inherit' }
    );
  }
  server = spawn(process.execPath, ['scripts/serve-switch.mjs', `a=${outRoot}/a`, `b=${outRoot}/b`], {
    env: { ...process.env, PW_SWITCH_PORT: String(port) },
    stdio: 'inherit'
  });
  await expect
    .poll(async () => {
      try {
        return (await fetch(`${appUrl}version.json`)).status;
      } catch {
        return 0;
      }
    }, { timeout: 15_000 })
    .toBe(200);
});

test.afterAll(async () => {
  server?.kill('SIGTERM');
});

test('a new release is detected, applied, and reloads exactly once', async ({ page }) => {
  await switchTo('a');
  let loads = 0;
  page.on('load', () => loads++);

  await page.goto('./');
  await expect(page.locator('#root')).not.toBeEmpty();
  await waitForController(page);
  expect(await snap(page)).toMatchObject({ currentVersion: '0.3.0-a', currentBuild: 'aaaaaaa' });
  // First install is not an update: no reload, status settles on 'current'.
  await expect.poll(async () => (await snap(page)).status).toBe('current');
  expect(loads).toBe(1);

  await switchTo('b');
  await page.evaluate(() => (window as unknown as { __apsPwa: { check(): Promise<void> } }).__apsPwa.check());
  expect(await snap(page)).toMatchObject({ status: 'available', availableVersion: '0.3.0-b', currentVersion: '0.3.0-a' });
  // A visible tab is never reloaded automatically.
  await page.waitForTimeout(1000);
  expect(loads).toBe(1);
  expect((await snap(page)).status).toBe('available');

  const reloaded = page.waitForEvent('load');
  await page.evaluate(() => {
    const pwa = (window as unknown as { __apsPwa: { apply(): void } }).__apsPwa;
    pwa.apply();
    pwa.apply(); // duplicate call is guarded
  });
  await reloaded;
  await page.waitForFunction(() => (window as unknown as { __apsPwa?: { snapshot(): Snapshot } }).__apsPwa?.snapshot().currentVersion === '0.3.0-b');
  expect(await snap(page)).toMatchObject({ currentVersion: '0.3.0-b', currentBuild: 'bbbbbbb' });
  await expect.poll(async () => (await snap(page)).status).toBe('current');

  // Only one reload, even after things settle.
  await page.waitForTimeout(1500);
  expect(loads).toBe(2);
  // The new worker controls the page and the old release's cache is gone.
  expect(await page.evaluate(() => caches.keys())).toEqual(['aps-0.3.0-b-bbbbbbb']);
  const scriptUrl = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL);
  expect(scriptUrl).toBe(`${appUrl}sw.js`);
});

test('safe-idle policy: a hidden tab with no dirty work updates automatically', async ({ page }) => {
  await switchTo('a');
  await page.goto('./');
  await waitForController(page);
  await expect.poll(async () => (await snap(page)).status).toBe('current');

  await switchTo('b');
  // Simulate the user leaving the tab (headless pages are always 'visible').
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const reloaded = page.waitForEvent('load');
  await page.evaluate(() => (window as unknown as { __apsPwa: { check(): Promise<void> } }).__apsPwa.check());
  await reloaded;
  await page.waitForFunction(() => (window as unknown as { __apsPwa?: { snapshot(): Snapshot } }).__apsPwa?.snapshot().currentVersion === '0.3.0-b');
});

test('offline navigation after the first load still renders the app shell', async ({ page, context }) => {
  await switchTo('a');
  await page.goto('./#/students');
  await expect(page.locator('#root')).not.toBeEmpty();
  await waitForController(page);

  // Go fully offline: browser emulation plus a server that drops every connection.
  await switchTo('off');
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('#root')).not.toBeEmpty();
    expect(await snap(page)).toMatchObject({ currentVersion: '0.3.0-a' });
    await expect.poll(async () => (await snap(page)).status).toBe('offline');
  } finally {
    await context.setOffline(false);
    await switchTo('a');
  }
});
