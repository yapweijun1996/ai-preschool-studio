import { buildFooter, expect, openVisualPage, test } from './visual/fixtures';

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

test('catalog sections · desktop light', async ({ page }) => {
  await page.setViewportSize(desktop);
  await openVisualPage(page, './#/catalog');
  const sections = page.locator('section.catalog-section');
  for (let i = 0; i < await sections.count(); i += 1) {
    const section = sections.nth(i);
    const heading = (await section.locator('h2').innerText()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await expect(section).toHaveScreenshot(`catalog-${heading}-desktop-light.png`);
  }
});

test('catalog sections · desktop dark', async ({ page }) => {
  await page.setViewportSize(desktop);
  await openVisualPage(page, './#/catalog', 'dark');
  const sections = page.locator('section.catalog-section');
  for (let i = 0; i < await sections.count(); i += 1) {
    const section = sections.nth(i);
    const heading = (await section.locator('h2').innerText()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await expect(section).toHaveScreenshot(`catalog-${heading}-desktop-dark.png`);
  }
});

test('catalog first four sections · mobile light', async ({ page }) => {
  await page.setViewportSize(mobile);
  await openVisualPage(page, './#/catalog');
  const sections = page.locator('section.catalog-section');
  for (let i = 0; i < Math.min(4, await sections.count()); i += 1) {
    const section = sections.nth(i);
    const heading = (await section.locator('h2').innerText()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await expect(section).toHaveScreenshot(`catalog-${heading}-mobile-light.png`);
  }
});

const screens = [
  { name: 'dashboard', path: './#/' },
  { name: 'students', path: './#/students' },
  { name: 'aria-profile', path: './#/students/aria' },
  { name: 'aria-studio', path: './#/students/aria/studio' },
  { name: 'aria-report', path: './#/students/aria/report' },
  { name: 'report-history', path: './#/students/meiling/report', role: 'reviewer' },
  { name: 'family-copy', path: './#/students/meiling/report/family', role: 'reviewer' },
  { name: 'audit', path: './#/audit', role: 'reviewer' },
  { name: 'coverage', path: './#/coverage' },
  { name: 'reviews', path: './#/reviews', role: 'reviewer' },
  { name: 'settings-framework', path: './#/settings/framework' }
] as const;

for (const screen of screens) {
  test(`${screen.name} · desktop light`, async ({ page }) => {
    await page.setViewportSize(desktop);
    await openVisualPage(page, screen.path, 'light', 'role' in screen ? screen.role : undefined);
    await expect(page).toHaveScreenshot(`${screen.name}-desktop-light.png`, { mask: [buildFooter(page)] });
  });
}

for (const name of ['dashboard', 'aria-studio', 'aria-report'] as const) {
  const screen = screens.find(({ name: screenName }) => screenName === name)!;
  test(`${screen.name} · mobile light`, async ({ page }) => {
    await page.setViewportSize(mobile);
    await openVisualPage(page, screen.path);
    await expect(page).toHaveScreenshot(`${screen.name}-mobile-light.png`, { mask: [buildFooter(page)] });
  });
}

test('coverage · mobile light', async ({ page }) => {
  await page.setViewportSize(mobile);
  await openVisualPage(page, './#/coverage');
  await expect(page).toHaveScreenshot('coverage-mobile-light.png', { mask: [buildFooter(page)] });
});

test('class roster · desktop light', async ({ page }) => {
  await page.setViewportSize(desktop);
  await openVisualPage(page, './#/classes');
  await page.getByRole('status', { name: 'Loading class roster…' }).waitFor({ state: 'hidden' });
  await expect(page).toHaveScreenshot('classes-desktop-light.png', { mask: [buildFooter(page)] });
});

test('class roster · mobile light', async ({ page }) => {
  await page.setViewportSize(mobile);
  await openVisualPage(page, './#/classes');
  await page.getByRole('status', { name: 'Loading class roster…' }).waitFor({ state: 'hidden' });
  await expect(page).toHaveScreenshot('classes-mobile-light.png', { mask: [buildFooter(page)] });
});

test('child family section · teacher desktop light', async ({ page }) => {
  await page.setViewportSize(desktop);
  await openVisualPage(page, './#/students/aria');
  const family = page.locator('.family-section');
  await expect(family).toBeVisible();
  await expect(family).toHaveScreenshot('aria-family-teacher-desktop-light.png');
});

test('aria report · desktop dark', async ({ page }) => {
  await page.setViewportSize(desktop);
  await openVisualPage(page, './#/students/aria/report', 'dark');
  await expect(page).toHaveScreenshot('aria-report-desktop-dark.png', { mask: [buildFooter(page)] });
});


test('attendance register · desktop light', async ({ page }) => {
  await page.setViewportSize(desktop);
  await openVisualPage(page, './#/attendance');
  await expect(page.locator('#main .attendance-list[aria-busy="false"]')).toBeVisible();
  await expect(page.locator('#main')).toHaveScreenshot('attendance-desktop-light.png', { mask: [buildFooter(page)] });
});

test('attendance register · mobile light', async ({ page }) => {
  await page.setViewportSize(mobile);
  await openVisualPage(page, './#/attendance');
  await expect(page.locator('#main .attendance-list[aria-busy="false"]')).toBeVisible();
  await expect(page.locator('#main')).toHaveScreenshot('attendance-mobile-light.png', { mask: [buildFooter(page)] });
});

test('attendance kiosk · desktop light', async ({ page }) => {
  await page.setViewportSize(desktop);
  await openVisualPage(page, './#/attendance/check-in');
  await expect(page.locator('#main #kiosk-panel')).toBeVisible();
  await expect(page.locator('#main')).toHaveScreenshot('attendance-check-in-desktop-light.png', { mask: [buildFooter(page)] });
});

test('attendance history · desktop light', async ({ page }) => {
  await page.setViewportSize(desktop);
  await openVisualPage(page, './#/attendance/history');
  await expect(page.locator('#main .attendance-list[aria-busy="false"]')).toBeVisible();
  await expect(page.locator('#main')).toHaveScreenshot('attendance-history-desktop-light.png', { mask: [buildFooter(page)] });
});
