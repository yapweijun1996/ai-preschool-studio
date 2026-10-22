import { expect, test } from '@playwright/test';

const shot = (name: string) => ({ path: `test-results/screens/${name}.png`, fullPage: true });

test.describe('ChatGPT-style sidebar · desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('rail + context panel: toggle collapses only the panel and persists', async ({ page }) => {
    await page.goto('./#/students');
    const panel = page.getByRole('complementary', { name: 'Students sidebar' });
    const rail = page.getByRole('navigation', { name: 'Main' });
    await expect(panel).toBeVisible();
    await expect(rail.getByRole('link', { name: 'Students' })).toHaveAttribute('aria-current', 'page');
    await expect(rail.getByRole('link', { name: 'Students' })).toHaveAttribute('data-tip', 'Students');
    await expect(panel.getByRole('link', { name: /^Version v\d+\.\d+\.\d+/ })).toHaveAttribute('href', '#/settings/about');
    await page.screenshot(shot('20-sidebar-open'));

    await panel.getByRole('button', { name: 'Close sidebar' }).click();
    await expect(panel).toBeHidden();
    await expect(rail).toBeVisible();
    await page.screenshot(shot('21-sidebar-collapsed'));

    await page.reload();
    await expect(page.getByRole('complementary', { name: 'Students sidebar' })).toBeHidden();

    // Rail icons still navigate while the panel is collapsed.
    await rail.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Good morning, Ms. Lim' })).toBeVisible();

    await page.keyboard.press('Control+Shift+S');
    await expect(page.getByRole('complementary', { name: 'Home sidebar' })).toBeVisible();
    await page.keyboard.press('Control+Shift+S');
    await expect(page.getByRole('complementary', { name: 'Home sidebar' })).toBeHidden();
    await rail.getByRole('button', { name: 'Open sidebar' }).click();
    await expect(page.getByRole('complementary', { name: 'Home sidebar' })).toBeVisible();
  });

  test('pinned and recent students, panel search', async ({ page }) => {
    await page.goto('./#/students/hana');
    await page.getByRole('button', { name: 'Pin to sidebar' }).click();
    const panel = page.getByRole('complementary', { name: 'Students sidebar' });
    await expect(panel.getByRole('link', { name: 'Hana Goh' })).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Hana Goh' })).toHaveAttribute('aria-current', 'page');

    await page.goto('./#/students/kai');
    await expect(panel.getByText('Recent')).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Kai Chen' })).toBeVisible();

    await panel.getByRole('button', { name: 'Search students' }).click();
    await page.getByRole('searchbox', { name: 'Search students' }).first().fill('nur');
    await expect(panel.getByRole('link', { name: 'Nur Aisyah' })).toBeVisible();
    await page.screenshot(shot('22-sidebar-search'));
  });

  test('reports panel deep-links the student list by status', async ({ page }) => {
    await page.goto('./#/students/aria/report');
    const panel = page.getByRole('complementary', { name: 'Reports sidebar' });
    await panel.getByRole('link', { name: /Approved/ }).click();
    await expect(page.getByRole('button', { name: 'Approved' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('main').getByRole('link', { name: /Mei Ling Chua/ })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: /Aria Tan/ })).toHaveCount(0);
  });

  test('theme and account menus are keyboard popovers', async ({ page }) => {
    await page.goto('./');
    const trigger = page.getByRole('button', { name: /^Theme:/ });
    await trigger.click();
    const menu = page.getByRole('menu', { name: 'Theme' });
    await expect(menu.getByRole('menuitemradio', { name: 'Light' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitemradio', { name: 'Dark' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.getByRole('button', { name: /Account menu/ }).click();
    await expect(page.getByRole('menu', { name: 'Account' }).getByText('Demo mode: no sign-in')).toBeVisible();
    await expect(page.getByRole('menu', { name: 'Account' }).getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '#/settings');
  });
});

test.describe('tablet 1024 sidebar', () => {
  test.use({ viewport: { width: 1024, height: 860 } });
  test('panel opens as an overlay and closes with Escape', async ({ page }) => {
    await page.goto('./#/students');
    await expect(page.getByRole('complementary', { name: 'Students sidebar' })).toBeHidden();
    await page.getByRole('button', { name: 'Open sidebar' }).click();
    await expect(page.getByRole('complementary', { name: 'Students sidebar' })).toBeVisible();
    await page.screenshot(shot('23-tablet-overlay'));
    await page.keyboard.press('Escape');
    await expect(page.getByRole('complementary', { name: 'Students sidebar' })).toBeHidden();
  });
});

test.describe('mobile 390 shell', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('bottom tab bar with a More sheet', async ({ page }) => {
    await page.goto('./#/students');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'More' }).click();
    const sheet = page.getByRole('menu', { name: 'More' });
    await expect(sheet.getByRole('menuitemcheckbox', { name: 'Simulate AI unavailable' })).toBeVisible();
    await page.screenshot(shot('24-mobile-more-sheet'));
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });
});
