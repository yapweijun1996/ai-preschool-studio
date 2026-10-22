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
  { name: 'settings-framework', path: './#/settings/framework' }
] as const;

for (const screen of screens) {
  test(`${screen.name} · desktop light`, async ({ page }) => {
    await page.setViewportSize(desktop);
    await openVisualPage(page, screen.path);
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

test('aria report · desktop dark', async ({ page }) => {
  await page.setViewportSize(desktop);
  await openVisualPage(page, './#/students/aria/report', 'dark');
  await expect(page).toHaveScreenshot('aria-report-desktop-dark.png', { mask: [buildFooter(page)] });
});
