import { expect, test, type Page } from '@playwright/test';

const shot = (name: string) => ({ path: `test-results/screens/${name}.png`, fullPage: true });

// Only shell strings (top bar, rail, context panel, menus, Settings) are asserted here.

test.describe('language menu · desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('switch to 中文, persist across reload, then Bahasa Melayu and back to English', async ({ page }) => {
    await page.goto('./#/students');
    await expect(page.getByRole('heading', { level: 1, name: 'My Students' })).toBeVisible();
    await page.waitForTimeout(500);
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');

    const trigger = page.getByRole('button', { name: /Language: English/ });
    await trigger.click();
    const menu = page.getByRole('menu', { name: 'Language' });
    await expect(menu.getByRole('menuitemradio', { name: 'English' })).toBeFocused();
    await expect(menu.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitemradio', { name: '中文' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(html).toHaveAttribute('lang', 'zh-Hans');
    const rail = page.getByRole('navigation', { name: '主导航' });
    await expect(rail.getByRole('link', { name: '学生' })).toHaveAttribute('aria-current', 'page');
    await expect(rail.getByRole('link', { name: '学生' })).toHaveAttribute('data-tip', '学生');
    await expect(rail.getByRole('button', { name: '更多' })).toBeVisible();
    await expect(page.locator('.ctx-head')).toHaveText('学生');
    await expect(page.locator('.topbar-context')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '语言：中文' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^主题：/ })).toBeVisible();
    await expect(page.getByText('演示模式——所有学生和观察记录均为虚构的示例数据')).toBeVisible();
    const panel = page.getByRole('complementary', { name: '学生侧边栏' });
    await expect(panel.getByRole('button', { name: '搜索学生' })).toBeVisible();
    await expect(panel.getByText('已置顶')).toBeVisible();
    await page.screenshot(shot('30-zh-students'));

    await page.reload();
    await expect(html).toHaveAttribute('lang', 'zh-Hans');
    await expect(page.getByRole('complementary', { name: '学生侧边栏' })).toBeVisible();

    await page.getByRole('button', { name: '语言：中文' }).click();
    await page.getByRole('menu', { name: '语言' }).getByRole('menuitemradio', { name: 'Bahasa Melayu' }).click();
    await expect(html).toHaveAttribute('lang', 'ms');
    await expect(page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Murid' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('complementary', { name: 'Bar sisi Murid' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tema: Cerah' })).toBeVisible();
    await expect(page.getByText('Mod demo — semua murid dan pemerhatian ialah data contoh rekaan')).toBeVisible();
    await page.screenshot(shot('31-ms-students'));

    await page.getByRole('button', { name: 'Bahasa: Bahasa Melayu' }).click();
    await page.getByRole('menu', { name: 'Bahasa' }).getByRole('menuitemradio', { name: 'English' }).click();
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('complementary', { name: 'Students sidebar' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Language: English/ })).toBeVisible();
  });
});

test.describe('settings · desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('theme, sidebar panel, language, demo control and About', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: /Account menu/ }).click();
    await page.getByRole('menu', { name: 'Account' }).getByRole('menuitem', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/#\/settings\/appearance$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Appearance' })).toBeVisible();
    await expect(page.locator('.ctx-head')).toHaveText('Settings');
    const panel = page.getByRole('complementary', { name: 'Settings sidebar' });
    await expect(panel.getByRole('link', { name: 'Appearance' })).toHaveAttribute('aria-current', 'page');
    await expect(panel.getByRole('link', { name: 'About & updates' })).toBeVisible();

    // Theme through Settings.
    await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
    await page.getByRole('radio', { name: 'Dark' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Theme: Dark' })).toBeVisible();
    await page.screenshot(shot('32-settings-appearance-dark'));

    // The sidebar checkbox drives the live panel.
    const panelBox = page.getByRole('checkbox', { name: 'Show the sidebar panel on desktop' });
    await expect(panelBox).toBeChecked();
    await panelBox.uncheck();
    await expect(panel).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible();
    await panelBox.check();
    await expect(panel).toBeVisible();

    // Language through Settings.
    await panel.getByRole('link', { name: 'Language' }).click();
    await expect(page).toHaveURL(/#\/settings\/language$/);
    await expect(page.getByText('Observation text and reports stay in the language they were written in.')).toBeVisible();
    await page.getByRole('radio', { name: '中文' }).check();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
    await expect(page.getByRole('heading', { level: 1, name: '语言' })).toBeVisible();
    await expect(page.locator('.ctx-head')).toHaveText('设置');
    await page.screenshot(shot('33-settings-language-zh-dark'));
    await page.getByRole('radio', { name: 'English' }).check();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // A demo control is a real switch shared with the More menu.
    await page.getByRole('complementary', { name: 'Settings sidebar' }).getByRole('link', { name: 'Demo data' }).click();
    const aiDown = page.getByRole('switch', { name: 'Simulate AI unavailable' });
    await expect(aiDown).not.toBeChecked();
    await aiDown.check();
    await expect(aiDown).toBeChecked();
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'More' }).click();
    await expect(page.getByRole('menu', { name: 'More' }).getByRole('menuitemcheckbox', { name: 'Simulate AI unavailable' })).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Reset demo data' }).click();
    await expect(page.getByText('Demo data reset.')).toBeVisible();
    await expect(aiDown).not.toBeChecked();

    // Version in the sidebar footer links to About.
    await page.getByRole('complementary', { name: 'Settings sidebar' }).getByRole('link', { name: /^Version v\d+\.\d+\.\d+/ }).click();
    await expect(page).toHaveURL(/#\/settings\/about$/);
    await expect(page.getByTestId('app-version')).toHaveText(/^v\d+\.\d+\.\d+/);
    await expect(page.getByRole('button', { name: 'Check for updates' })).toBeVisible();
    await expect(page.getByText('Works offline: the app shell and demo data on this device. The Mock provider runs locally; nothing is sent to a server.')).toBeVisible();
    await page.screenshot(shot('34-settings-about-dark'));
  });

  test('/settings redirects to Appearance and the More menu links to Settings', async ({ page }) => {
    await page.goto('./#/settings');
    await expect(page).toHaveURL(/#\/settings\/appearance$/);
    await page.goto('./#/students');
    await expect(page.getByRole('heading', { level: 1, name: 'My Students' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'More' }).click();
    await page.getByRole('menu', { name: 'More' }).getByRole('menuitem', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Appearance' })).toBeVisible();
  });
});

async function smallControls(page: Page) {
  return page.$$eval('button, a[href], input, select, textarea', (els) =>
    els
      .filter((e) => (e as HTMLElement).offsetParent !== null && !e.closest('.sr-only'))
      .map((e) => ({ t: (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30), h: e.getBoundingClientRect().height }))
      .filter((x) => x.h < 44)
  );
}

test.describe('settings · mobile 390', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('language and Settings from the More sheet; 44px targets on Appearance', async ({ page }) => {
    await page.goto('./#/students');
    await expect(page.getByRole('heading', { level: 1, name: 'My Students' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'More' }).click();
    const sheet = page.getByRole('menu', { name: 'More' });
    await expect(sheet.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
    await sheet.getByRole('menuitemradio', { name: '中文' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
    await expect(page.getByText('演示模式 · 虚构示例数据')).toBeVisible();

    await page.getByRole('navigation', { name: '主导航' }).getByRole('button', { name: '更多' }).click();
    const zhSheet = page.getByRole('menu', { name: '更多' });
    await expect(zhSheet.getByRole('menuitem', { name: '设置' })).toBeVisible();
    await page.screenshot(shot('35-mobile-more-zh'));
    await zhSheet.getByRole('menuitemradio', { name: 'English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'More' }).click();
    await page.getByRole('menu', { name: 'More' }).getByRole('menuitem', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/#\/settings\/appearance$/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Settings' }).getByRole('link', { name: 'Appearance' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('radio', { name: 'System' })).toBeVisible();
    await expect(page.getByText('Demo mode · fictional sample data')).toBeVisible();
    await page.screenshot(shot('36-mobile-settings-appearance'));

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(await smallControls(page)).toEqual([]);

    await page.getByRole('navigation', { name: 'Settings' }).getByRole('link', { name: 'About & updates' }).click();
    await expect(page.getByTestId('app-version')).toHaveText(/^v\d+\.\d+\.\d+/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot(shot('37-mobile-settings-about'));
  });
});
