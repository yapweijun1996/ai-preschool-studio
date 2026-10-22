import { expect, test } from '@playwright/test';

test('the app shell and navigation remain mounted while Coverage loads', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & { __watchShell?: boolean; __shellWasMissing?: boolean };
    state.__watchShell = false;
    state.__shellWasMissing = false;
    window.setInterval(() => {
      if (state.__watchShell && (!document.querySelector('.app') || !document.querySelector('.app nav'))) {
        state.__shellWasMissing = true;
      }
    }, 20);
  });

  let resolveChunkStarted!: () => void;
  const chunkStarted = new Promise<void>((resolve) => { resolveChunkStarted = resolve; });
  await page.route(/Coverage-[^/]+\.js/, async (route) => {
    resolveChunkStarted();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.goto('./#/');
  await expect(page.locator('#rp-h')).toBeVisible();
  await page.evaluate(() => { (window as Window & { __watchShell?: boolean }).__watchShell = true; });

  await page.getByRole('link', { name: 'Evidence coverage' }).click();
  await chunkStarted;
  await expect(page.getByTestId('route-pending')).toBeVisible();
  await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.app')).toBeVisible();
  await expect(page.locator('.app nav').first()).toBeVisible();
  await expect(page.locator('#main .route-loading')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Evidence coverage' })).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('route-pending')).toHaveCount(0);
  await expect(page.locator('#main')).not.toHaveAttribute('aria-busy', 'true');
  expect(await page.evaluate(() => (window as Window & { __shellWasMissing?: boolean }).__shellWasMissing)).toBe(false);
  await expect(page.locator('.app nav').first()).toBeVisible();
});
