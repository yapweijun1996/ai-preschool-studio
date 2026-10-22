import { expect, test, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

async function entryScriptPath(page: Page) {
  const response = await page.request.get('./');
  const html = await response.text();
  const script = /src="([^"]*\/assets\/index-[^"]+\.js)"/.exec(html)?.[1];
  if (!script) throw new Error('Could not find the Vite entry script in the app HTML.');
  return new URL(script, response.url()).pathname;
}

test('a failed preferred language load retries in English', async ({ page }) => {
  const entry = await entryScriptPath(page);
  await page.addInitScript(() => localStorage.setItem('aps-lang', 'zh'));
  let failedLocalePath: string | undefined;
  await page.route('**/assets/index-*.js', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === entry) return route.continue();
    failedLocalePath ??= path;
    if (path === failedLocalePath) return route.fulfill({ status: 404, contentType: 'text/javascript', body: '' });
    return route.continue();
  });

  await page.goto('./#/');
  await expect(page.getByRole('heading', { name: 'Good morning, Ms. Lim' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('a failed preferred language and English load show static recovery', async ({ page }) => {
  const entry = await entryScriptPath(page);
  let documentRequests = 0;
  page.on('request', (request) => { if (request.isNavigationRequest()) documentRequests += 1; });
  await page.addInitScript(() => localStorage.setItem('aps-lang', 'zh'));
  await page.route('**/assets/index-*.js', (route) => {
    const path = new URL(route.request().url()).pathname;
    return path === entry ? route.continue() : route.fulfill({ status: 404, contentType: 'text/javascript', body: '' });
  });

  await page.goto('./#/');
  await expect(page.getByRole('alert')).toContainText('The app could not load. Reload to try again.');
  await expect(page.getByRole('alert').getByRole('button', { name: 'Reload' })).toBeVisible();
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect.poll(() => documentRequests).toBeLessThanOrEqual(2);
});
