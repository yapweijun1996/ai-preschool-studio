import { expect, test } from '@playwright/test';

test.describe('learning framework · desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Settings › Learning framework lists areas with NEL mapping, the scale and periods', async ({ page }) => {
    await page.goto('./#/settings/framework');
    await expect(page.getByRole('heading', { level: 1, name: 'Learning framework' })).toBeVisible();
    await expect(page.getByText('Version 2026.1')).toBeVisible();
    const areas = page.locator('.settings-card', { hasText: 'Learning areas' }).locator('.framework-row');
    await expect(areas).toHaveCount(4);
    await expect(areas.nth(0)).toContainText('English Language 英语');
    await expect(areas.nth(0)).toContainText('NEL (demo mapping): Language and Literacy');
    await expect(areas.nth(2)).toContainText('NEL (demo mapping): Numeracy');
    await expect(areas.nth(3)).toContainText('Social and Emotional Competencies');
    await expect(page.locator('.settings-card', { hasText: 'Milestone scale' }).locator('.ms')).toHaveCount(3);
    await expect(page.locator('.settings-card', { hasText: 'Reporting periods' }).locator('.framework-row')).toHaveCount(2);
    await expect(page.getByRole('complementary', { name: 'Settings sidebar' }).getByRole('link', { name: 'Learning framework' })).toHaveAttribute('aria-current', 'page');
  });

  test('the same labels flow to Progress and to an approved report with its version', async ({ page }) => {
    await page.goto('./#/students/aria/progress');
    await expect(page.locator('#domain-ma')).toContainText('NEL (demo mapping): Numeracy');
    await page.goto('./#/students/meiling/report');
    await expect(page.locator('.a4')).toContainText('K2 demo framework v2026.1');
  });

  test('no unfilled {term} placeholders on pages that name a period', async ({ page }) => {
    for (const path of ['./#/students/aria', './#/students/aria/progress', './#/students/aria/studio', './#/students/kai', './#/students/aria/report', './#/students/aria/observe']) {
      await page.goto(path);
      await expect(page.locator('main')).not.toContainText(/\{term/);
    }
  });

  test('a tab holding demo state from an older build starts fresh instead of breaking', async ({ page }) => {
    await page.addInitScript(() => {
      // Shape saved by v0.3.5 and earlier: 12 students, no schema tag.
      const legacy = { observations: [], paragraphs: {}, reflections: {}, reports: { aria: { status: 'draft', hadChanges: false } }, sim: { aiDown: false, saveFail: false }, nextObsNumber: 158 };
      sessionStorage.setItem('aps-demo-state-v1', JSON.stringify(legacy));
      sessionStorage.setItem('aps-demo-state', JSON.stringify({ schema: 1, state: legacy }));
    });
    await page.goto('./#/students');
    await expect(page.getByText('20 students')).toBeVisible();
    await page.goto('./#/students/priya');
    await expect(page.getByRole('heading', { level: 1, name: 'Priya Raman' })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('aps-demo-state-v1'))).toBeNull();
  });

  test('framework labels follow the language', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('aps-lang', 'zh'));
    await page.goto('./#/settings/framework');
    await expect(page.getByRole('heading', { level: 1, name: '学习框架' })).toBeVisible();
    await expect(page.locator('.framework-row').first()).toContainText('英语 English Language');
    await expect(page.locator('.framework-row').first()).toContainText('语言与读写');
    await page.goto('./#/students/aria');
    await expect(page.locator('.domain-grid > article').first()).toContainText('稳定表现');
  });
});
