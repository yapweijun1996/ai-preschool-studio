import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('the initial lazy route is preloaded before the interactive shell mounts', async ({ page }) => {
  let resolveChunkStarted!: () => void;
  const chunkStarted = new Promise<void>((resolve) => { resolveChunkStarted = resolve; });
  await page.route(/Coverage-[^/]+\.js/, async (route) => {
    resolveChunkStarted();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });

  const navigation = page.goto('./#/coverage');
  await chunkStarted;
  await expect(page.locator('.app')).toHaveCount(0);
  await expect(page.locator('#root')).toBeEmpty();
  await expect(page.getByRole('heading', { name: 'Evidence coverage' })).toBeVisible();
  await navigation;
});
