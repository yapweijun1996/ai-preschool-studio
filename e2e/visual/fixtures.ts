import { expect, test as base } from '@playwright/test';

// Visual runs freeze browser time because a few UI actions use Date.now()/new Date(),
// block service workers so an update banner cannot arrive asynchronously, and use a fresh
// Playwright context per test with explicit theme/language storage. The build footer is
// masked because its short commit SHA changes on every CI run. CSS uses system font stacks
// (no self-hosted fonts), so wait for document.fonts.ready before capturing pixels.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(new Date('2026-10-22T09:00:00+08:00'));
    await use(page);
  }
});

export { expect };

export async function openVisualPage(page: import('@playwright/test').Page, path: string, theme: 'light' | 'dark' = 'light') {
  await page.addInitScript(({ theme }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('aps-theme', theme);
    localStorage.setItem('aps-lang', 'en');
  }, { theme });
  await page.goto(path);
  await expect(page.getByRole('main')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

export const buildFooter = (page: import('@playwright/test').Page) => page.locator('.ctx-version');
