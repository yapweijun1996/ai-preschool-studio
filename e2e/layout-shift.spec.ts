import { expect, test } from '@playwright/test';

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
