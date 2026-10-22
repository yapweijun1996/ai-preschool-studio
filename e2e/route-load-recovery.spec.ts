import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('a missing Coverage chunk recovers once and shows an accessible reload card', async ({ page }) => {
  let documentRequests = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest()) documentRequests += 1;
  });
  await page.route(/Coverage-[^/]+\.js/, (route) => route.fulfill({ status: 404, contentType: 'text/javascript', body: '' }));

  await page.goto('./#/');
  await expect(page.locator('#rp-h')).toBeVisible();
  await page.getByRole('link', { name: 'Evidence coverage' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toContainText('This page could not load. Reload to get the latest version.');
  await expect(alert.getByRole('button', { name: 'Reload' })).toBeVisible();
  await expect(page.locator('#root')).not.toBeEmpty();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' }).click();
  await expect(page.locator('#rp-h')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect.poll(() => documentRequests).toBeLessThanOrEqual(2);
});
