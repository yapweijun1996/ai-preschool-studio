import { expect, test } from '@playwright/test';

const shot = (name: string) => ({ path: `test-results/screens/${name}.png`, fullPage: false });

test.describe('breadcrumb, search and domain links · desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('top bar breadcrumb names the page and links to its parents', async ({ page }) => {
    await page.goto('./#/students/aria/studio');
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('listitem')).toHaveCount(3);
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('AI Portfolio Studio');
    await crumbs.getByRole('link', { name: 'Aria Tan' }).click();
    await expect(page).toHaveURL(/#\/students\/aria$/);
    // Profile: the breadcrumb replaces the back arrow.
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Aria Tan');
    await expect(page.getByRole('link', { name: 'Back to My Students' })).toHaveCount(0);
    await crumbs.getByRole('link', { name: 'Students' }).click();
    await expect(page).toHaveURL(/#\/students$/);
    await expect(crumbs.getByRole('listitem')).toHaveCount(1);
  });

  test('Ctrl+K opens search; keyboard picks a student; Esc returns focus', async ({ page }) => {
    await page.goto('./#/');
    const trigger = page.getByRole('button', { name: 'Search students or pages' });
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    const box = dialog.getByRole('combobox', { name: 'Search' });
    await expect(box).toBeFocused();
    await expect(dialog.getByRole('option')).toHaveCount(15);
    await box.fill('mei');
    await expect(dialog.getByRole('option')).toHaveCount(1);
    await expect(dialog.getByRole('option', { name: /Mei Ling Chua/ })).toHaveAttribute('aria-selected', 'true');
    await page.screenshot(shot('50-search'));
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/students\/meiling$/);
    await expect(dialog).toBeHidden();

    await trigger.click();
    await expect(box).toBeFocused();
    await box.fill('zzz');
    await expect(dialog.getByRole('status')).toHaveText('No results for “zzz”.');
    await box.fill('set');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/settings\/appearance$/);

    await trigger.click();
    await page.keyboard.press('ArrowDown');
    await expect(box).toHaveAttribute('aria-activedescendant', /-1$/);
    await page.keyboard.press('Tab');
    await expect(box).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('domain cards open Learning progress on that domain; the note is readable', async ({ page }) => {
    await page.goto('./#/students/aria');
    const note = page.locator('.note-line');
    await expect(note).toContainText('They are not scores.');
    expect(await note.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    expect(await page.locator('.measure').first().evaluate((el) => getComputedStyle(el).maxWidth)).not.toBe('none');
    await expect(page.getByRole('link', { name: 'Compare Term 3 and Term 4', exact: true })).toHaveClass(/btn-ghost/);

    await page.getByRole('link', { name: /Social-Emotional Development.*compare Term 3 and Term 4/ }).click();
    await expect(page).toHaveURL(/#\/students\/aria\/progress\?domain=se$/);
    const row = page.locator('#domain-se');
    await expect(row).toHaveClass(/row-focus/);
    await expect(row).toBeFocused();
    await expect(row).toBeInViewport();
  });

  test('search and breadcrumb follow the language', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('aps-lang', 'zh'));
    await page.goto('./#/students/aria');
    await expect(page.getByRole('navigation', { name: '导航路径' }).getByRole('link', { name: '学生' })).toBeVisible();
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: '搜索' }).getByRole('combobox')).toHaveAttribute('placeholder', '搜索学生或页面…');
  });
});

test.describe('search · tablet 1024', () => {
  test.use({ viewport: { width: 1024, height: 860 }, hasTouch: true });
  test('icon-only search trigger (44px) and breadcrumb fit the top bar', async ({ page }) => {
    await page.goto('./#/students/aria/report');
    const trigger = page.getByRole('button', { name: 'Search students or pages' });
    const b = await trigger.boundingBox();
    expect(b!.width).toBeGreaterThanOrEqual(44);
    expect(b!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).locator('[aria-current="page"]')).toHaveText('Report preview');
    const overflow = await page.locator('.topbar').evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });
});
