import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
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

// a-nosw: release a without sw.js (registration fails); b-nover: release b without version.json.
type Root = 'a' | 'b' | 'a-nosw' | 'b-nover' | 'off';
const switchTo = async (to: Root, opts: { pagesCache?: boolean } = {}) => {
  const res = await fetch(`${origin}/__switch?to=${to}${opts.pagesCache ? '&cache=pages' : ''}`, { method: 'POST' });
  expect(res.ok).toBe(true);
};
const check = (page: Page) => page.evaluate(() => (window as unknown as { __apsPwa: { check(): Promise<void> } }).__apsPwa.check());

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
  // Broken variants: a release whose sw.js 404s, and one whose version.json 404s.
  for (const [name, from, drop] of [['a-nosw', 'a', 'sw.js'], ['b-nover', 'b', 'version.json']]) {
    rmSync(`${outRoot}/${name}`, { recursive: true, force: true });
    cpSync(`${outRoot}/${from}`, `${outRoot}/${name}`, { recursive: true });
    rmSync(`${outRoot}/${name}/${drop}`);
  }
  const roots = ['a', 'b', 'a-nosw', 'b-nover'].map((n) => `${n}=${outRoot}/${n}`);
  server = spawn(process.execPath, ['scripts/serve-switch.mjs', ...roots], {
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

// Manager probe: the visible update UI (shell) driving the real service worker end to end.
test('visible update UI: dirty work blocks, then "Update to v…" installs the new release', async ({ page }) => {
  await switchTo('a');
  let loads = 0;
  page.on('load', () => loads++);

  // Add observation's prefilled demo text is not unsaved work; once the teacher edits it, it is,
  // and updating must wait.
  await page.goto('./#/students/aria/observe');
  await waitForController(page);
  await expect.poll(async () => (await snap(page)).status).toBe('current');
  expect((await snap(page)).hasDirtyWork).toBe(false);
  const draft = page.locator('#obs-text');
  await draft.fill(`${await draft.inputValue()} Then she counted the big group aloud.`);
  await expect.poll(async () => (await snap(page)).hasDirtyWork).toBe(true);
  await switchTo('b');
  await page.evaluate(() => (window as unknown as { __apsPwa: { check(): Promise<void> } }).__apsPwa.check());

  const update = page.getByRole('button', { name: 'Update to v0.3.0-b' });
  await expect(update).toBeVisible();
  expect((await snap(page)).hasDirtyWork).toBe(true);
  await update.click();
  await expect(page.getByRole('status').filter({ hasText: 'Save or finish your work first' })).toHaveCount(1);
  await expect(page.locator('p', { hasText: 'Save or finish your work first; the update will wait.' })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(loads).toBe(1);
  expect((await snap(page)).currentVersion).toBe('0.3.0-a');

  // Leave the draft for a screen without unsaved work, then update from the top bar.
  await page.goto('./#/students');
  await expect(page.getByText('Update available')).toBeVisible();
  await page.getByRole('button', { name: 'Update to v0.3.0-b' }).click();
  await expect.poll(() => loads, { timeout: 15_000 }).toBe(2);
  await expect.poll(async () => (await snap(page)).currentVersion).toBe('0.3.0-b');
  await page.waitForTimeout(1000);
  expect(loads).toBe(2);

  await page.goto('./#/settings/about');
  await expect(page.getByTestId('app-version')).toContainText('0.3.0-b');
});

test('a failed service worker registration recovers through the visible Retry', async ({ page }) => {
  // sw.js 404s: registration fails and the error banner offers Retry.
  await switchTo('a-nosw');
  await page.goto('./');
  await expect(page.locator('#root')).not.toBeEmpty();
  const alert = page.getByRole('alert').filter({ hasText: 'Couldn’t check for updates.' });
  await expect(alert).toBeVisible();
  expect((await snap(page)).status).toBe('error');
  expect(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()))).toBe(false);

  // The file is back: Retry registers the worker and the check completes.
  await switchTo('a');
  await alert.getByRole('button', { name: 'Retry' }).click();
  await expect.poll(async () => (await snap(page)).status).toBe('current');
  await expect(alert).toHaveCount(0);
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL)).toBe(`${appUrl}sw.js`);
  await waitForController(page);
});

test('unknown new version: the button says "Update now", never "Update to v"', async ({ page }) => {
  await switchTo('a');
  let loads = 0;
  page.on('load', () => loads++);
  await page.goto('./');
  await waitForController(page);
  await expect.poll(async () => (await snap(page)).status).toBe('current');

  // The new release's version.json cannot be read (fetched twice, both 404).
  await switchTo('b-nover');
  await check(page);
  expect(await snap(page)).toMatchObject({ status: 'available', availableVersion: undefined });
  const update = page.getByRole('button', { name: 'Update now', exact: true });
  await expect(update).toBeVisible();
  await expect(page.getByRole('button', { name: /^Update to v/ })).toHaveCount(0);

  await update.click();
  await expect.poll(() => loads, { timeout: 15_000 }).toBe(2);
  await expect.poll(async () => (await snap(page)).currentVersion).toBe('0.3.0-b');
});

test('apply failure (reload-loop guard): own message, update stays on offer, never a false "current"', async ({ page }) => {
  await switchTo('a');
  let loads = 0;
  page.on('load', () => { if (page.url() !== 'about:blank') loads++; });
  await page.goto('./');
  await waitForController(page);
  await expect.poll(async () => (await snap(page)).status).toBe('current');
  await switchTo('b');
  await check(page);
  expect(await snap(page)).toMatchObject({ status: 'available', availableVersion: '0.3.0-b' });

  // Pretend this tab just reloaded for an update, so the 30 s loop guard refuses the next reload
  // after the new worker has already taken over.
  await page.evaluate(() => sessionStorage.setItem('aps-pwa-reload-at', String(Date.now())));
  await page.getByRole('button', { name: 'Update to v0.3.0-b' }).click();
  const alert = page.getByRole('alert').filter({ hasText: 'The update couldn’t be installed.' });
  await expect(alert).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Couldn’t check for updates.' })).toHaveCount(0);
  expect(loads).toBe(1);
  expect((await snap(page)).currentVersion).toBe('0.3.0-a');
  // The update stays available while it is still pending.
  await expect(page.getByRole('button', { name: 'Update to v0.3.0-b' })).toBeVisible();

  // Retry re-offers the update; a later check still reports it (reload needed), never 'current'.
  await alert.getByRole('button', { name: 'Retry' }).click();
  await expect(alert).toHaveCount(0);
  expect((await snap(page)).status).toBe('available');
  await check(page);
  expect((await snap(page)).status).toBe('available');
  await expect(page.getByRole('button', { name: 'Update to v0.3.0-b' })).toBeVisible();

  // Once the guard window is over, updating reloads exactly once into the new release.
  await page.evaluate(() => sessionStorage.removeItem('aps-pwa-reload-at'));
  await page.getByRole('button', { name: 'Update to v0.3.0-b' }).click();
  await expect.poll(() => loads, { timeout: 15_000 }).toBe(2);
  await expect.poll(async () => (await snap(page)).currentVersion).toBe('0.3.0-b');
  await page.waitForTimeout(1000);
  expect(loads).toBe(2);
});

test('navigations bypass the 10-minute HTTP cache (GitHub Pages max-age) and get the new shell', async ({ page }) => {
  // Serve with Pages-like caching from the first load, so index.html sits in the HTTP cache.
  await switchTo('a', { pagesCache: true });
  await page.goto('./');
  await waitForController(page);
  await expect.poll(async () => (await snap(page)).status).toBe('current');

  // Deploy b, leave, and come back with an ordinary (non-reload) navigation.
  await switchTo('b', { pagesCache: true });
  await page.goto('about:blank');
  await page.goto('./');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect.poll(async () => (await snap(page)).currentVersion).toBe('0.3.0-b');
});
