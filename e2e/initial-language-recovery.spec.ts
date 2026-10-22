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

test('a failed language switch keeps the selected language and announces the error', async ({ page }) => {
  const entry = await entryScriptPath(page);
  let englishChunkPath: string | undefined;
  let documentRequests = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest()) documentRequests += 1;
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/assets/index-') && path !== entry) englishChunkPath ??= path;
  });
  await page.goto('./#/');
  await expect(page.locator('#rp-h')).toBeVisible();
  expect(englishChunkPath).toBeTruthy();
  await page.route('**/assets/index-*.js', (route) => {
    const path = new URL(route.request().url()).pathname;
    return path === entry || path === englishChunkPath
      ? route.continue()
      : route.fulfill({ status: 404, contentType: 'text/javascript', body: '' });
  });

  await page.getByRole('button', { name: /Language: English/ }).click();
  await page.getByRole('menuitemradio', { name: '中文' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'The language could not be loaded. Your current language is unchanged.' })).toHaveText('The language could not be loaded. Your current language is unchanged.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: /Language: English/ })).toBeVisible();
  expect(documentRequests).toBe(1);
});
