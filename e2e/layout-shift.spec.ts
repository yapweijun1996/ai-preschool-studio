import { expect, test } from '@playwright/test';

for (const route of [
  { path: '#/students', ready: '.row-link', name: 'students' },
  { path: '#/students/aria/studio', ready: '.studio-head h1', name: 'studio' },
  { path: '#/students/aria/report', ready: '.a4', name: 'report' },
  { path: '#/catalog', ready: '.catalog-page h2', name: 'catalog' },
  { path: '#/classes', ready: '.class-roster .row-link', name: 'classes' }
]) {
  test(`${route.name} layout shift stays below 0.05 on a slow connection`, async ({ page }) => {
    await page.addInitScript(() => {
      const measuredWindow = window as Window & { __layoutShiftTotal?: number };
      measuredWindow.__layoutShiftTotal = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
          if (!entry.hadRecentInput) measuredWindow.__layoutShiftTotal! += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8
    });

    await page.goto(`./${route.path}`);
    if (route.name === 'classes') {
      await expect(page.locator('h1.h1')).toBeVisible();
      await page.getByRole('status', { name: 'Loading class roster…' }).waitFor({ state: 'hidden' });
    }
    await expect(page.locator(route.ready).first()).toBeVisible();
    await page.waitForTimeout(1500);
    const total = await page.evaluate(() => (window as Window & { __layoutShiftTotal?: number }).__layoutShiftTotal ?? 0);
    expect(total, `${route.name} cumulative layout shift was ${total}`).toBeLessThan(0.05);
    await cdp.detach();
  });
}

for (const role of ['teacher', 'reviewer'] as const) {
  test(`dashboard layout shift stays below 0.05 · ${role}`, async ({ page }) => {
    await page.addInitScript(({ role }) => {
      const measuredWindow = window as Window & { __layoutShiftTotal?: number };
      measuredWindow.__layoutShiftTotal = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
          if (!entry.hadRecentInput) measuredWindow.__layoutShiftTotal! += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      sessionStorage.setItem('aps-demo-role', role);
    }, { role });

    await page.goto('./#/');
    await expect(page.locator('#rp-h')).toBeVisible();
    if (role === 'reviewer') {
      await page.getByRole('status', { name: 'Loading review queue…' }).waitFor({ state: 'hidden' });
    }
    await page.waitForTimeout(1000);
    const total = await page.evaluate(() => (window as Window & { __layoutShiftTotal?: number }).__layoutShiftTotal ?? 0);
    expect(total, `cumulative layout shift was ${total}`).toBeLessThan(0.05);
  });
}

test('in-app Dashboard to Coverage navigation stays below 0.05 CLS', async ({ page }) => {
  await page.addInitScript(() => {
    const measuredWindow = window as Window & { __layoutShiftTotal?: number };
    measuredWindow.__layoutShiftTotal = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
        if (!entry.hadRecentInput) measuredWindow.__layoutShiftTotal! += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8
  });

  await page.goto('./#/');
  await expect(page.locator('#rp-h')).toBeVisible();
  await page.getByRole('link', { name: 'Evidence coverage' }).click();
  await expect(page.locator('#main').getByRole('heading', { name: 'Evidence coverage' })).toBeVisible();
  await page.getByRole('button', { name: 'All', exact: true }).waitFor({ state: 'visible' });
  const total = await page.evaluate(() => (window as Window & { __layoutShiftTotal?: number }).__layoutShiftTotal ?? 0);
  expect(total, `in-app Dashboard to Coverage cumulative layout shift was ${total}`).toBeLessThan(0.05);
  await cdp.detach();
});
