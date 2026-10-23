import { expect, test as base } from '@playwright/test';

// Visual runs freeze browser time because a few UI actions use Date.now()/new Date(),
// pin timezone/locale to Asia/Singapore and en-SG, block service workers so an update banner
// cannot arrive asynchronously, and use a fresh Playwright context per test with explicit
// theme/language storage. The build footer is
// masked because its short commit SHA changes on every CI run. CSS uses system font stacks
// (no self-hosted fonts), so wait for document.fonts.ready before capturing pixels.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(new Date('2026-10-22T09:00:00+08:00'));
    await use(page);
  }
});

export { expect };

export async function openVisualPage(page: import('@playwright/test').Page, path: string, theme: 'light' | 'dark' = 'light', role?: string) {
  await page.addInitScript(({ theme, role }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('aps-theme', theme);
    localStorage.setItem('aps-lang', 'en');
    if (role) sessionStorage.setItem('aps-demo-role', role);
  }, { theme, role });
  await page.goto(path);
  await expect(page.getByRole('main')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await settleVisualPage(page, path);
}

/** Wait for asynchronous UI that can otherwise leave a screenshot on a fallback state. */
export async function settleVisualPage(page: import('@playwright/test').Page, path: string) {
  const main = page.locator('#main');
  // The catalog is a lazy route and Students has a short simulated fetch.
  await page.getByRole('status', { name: 'Loading catalog' }).waitFor({ state: 'hidden' });
  await page.getByRole('status', { name: 'Loading students…' }).waitFor({ state: 'hidden' });
  await page.getByRole('status', { name: 'Loading evidence coverage…' }).waitFor({ state: 'hidden' });
  await page.getByRole('status', { name: 'Loading review queue…' }).waitFor({ state: 'hidden' });

  // PWA update UI is normally prevented by the visual project's blocked service workers;
  // make the settled-state expectation explicit in case the shell has already surfaced it.
  await page.locator('.update-overlay, .update-banner').waitFor({ state: 'hidden' });
  await page.getByRole('status', { name: 'Saving…' }).waitFor({ state: 'hidden' });

  // `main` is part of AppShell and appears before lazy route chunks and async page data.
  // Wait for the actual content represented by each visual target before capturing pixels.
  if (path.includes('/classes')) {
    await expect(main.getByRole('heading', { name: 'Classes', exact: true })).toBeVisible();
    await expect(main.locator('.class-roster .row-link').first()).toBeVisible();
  } else if (path.includes('/catalog')) {
    await expect(page.locator('section.catalog-section h2').first()).toBeVisible();
  } else if (path.includes('/students/aria') && !path.includes('/studio') && !path.includes('/report')) {
    await expect(page.locator('.family-section h2#family-heading')).toBeVisible();
  } else if (path.includes('/students/')) {
    if (path.includes('/studio')) {
      const mobileTabs = page.getByRole('tablist', { name: 'Studio sections' });
      await expect(page.locator('.studio-head h1').or(page.getByRole('tab', { name: 'Write', exact: true })).first()).toBeVisible();
      if (await mobileTabs.isVisible()) {
        await expect(page.getByRole('tab', { name: 'Write', exact: true })).toBeVisible();
      } else {
        await expect(page.locator('.studio-head h1')).toBeVisible();
      }
    } else if (path.includes('/report')) {
      await expect(page.locator('.a4')).toBeVisible();
    } else {
      await expect(page.locator('h1.h1').first()).toBeVisible();
    }
  } else if (path.includes('/coverage')) {
    await expect(page.locator('.coverage-page h1, h1.h1').first()).toBeVisible();
  } else if (path.includes('/attendance/kiosk')) {
    await expect(main.getByRole('heading', { name: 'Check-in kiosk' })).toBeVisible();
    await expect(main.locator('#kiosk-panel')).toBeVisible();
  } else if (path.includes('/attendance/history')) {
    await expect(main.getByRole('heading', { name: 'Attendance history' })).toBeVisible();
    await expect(main.locator('.attendance-list[aria-busy="false"]')).toBeVisible();
  } else if (path.includes('/attendance')) {
    await expect(main.getByRole('heading', { name: 'Attendance', exact: true })).toBeVisible();
    await expect(main.locator('.attendance-list[aria-busy="false"]')).toBeVisible();
  } else if (path.includes('/reviews')) {
    await expect(page.locator('h1.h1').first()).toBeVisible();
  } else if (path.includes('/settings')) {
    await expect(page.locator('h1.h1').first()).toBeVisible();
  } else if (path.includes('/audit')) {
    await expect(page.locator('h1.h1').first()).toBeVisible();
  } else if (path.endsWith('#/') || path.endsWith('/#/') || path === './#/') {
    await expect(page.locator('#rp-h')).toBeVisible();
  } else if (path.includes('/students')) {
    await expect(page.locator('h1.h1').first()).toBeVisible();
    await page.getByRole('status', { name: 'Loading students…' }).waitFor({ state: 'hidden' });
  }

  if (path.includes('/students/aria/studio')) {
    // Mobile captures show the Write tab. Visit AI, wait for its ready action, then restore
    // Write so the readiness check does not change the screenshot's intended contents.
    const mobile = await page.getByRole('tab', { name: 'AI', exact: true }).isVisible();
    if (mobile) await page.getByRole('tab', { name: 'AI', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeVisible();
    if (mobile) await page.getByRole('tab', { name: 'Write', exact: true }).click();
  }
}

export const buildFooter = (page: import('@playwright/test').Page) => page.locator('.ctx-version');
