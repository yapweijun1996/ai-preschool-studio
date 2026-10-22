import { expect, test } from '@playwright/test';

test.describe('UI polish · desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('home: report tiles contain their labels; one action row per student; named Home', async ({ page }) => {
    await page.goto('./#/');
    const overflow = await page.locator('.report-tile').evaluateAll((tiles) =>
      tiles.filter((t) => { const s = t.querySelector('.status')!.getBoundingClientRect(); const r = t.getBoundingClientRect(); return s.right > r.right - 1 || s.left < r.left; }).length);
    expect(overflow).toBe(0);
    const names = await page.getByRole('region', { name: 'Action required' }).locator('.row-link .strong').allTextContents();
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  test('observations panel: latest entries show full name and domain on two lines', async ({ page }) => {
    await page.goto('./#/students/aria/observe');
    const texts = page.locator('.nav-link-2 .nav-text');
    await expect(texts.first()).toContainText('Aria Tan');
    const clipped = await texts.evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
    // Long domain names may still ellipsize, but names and short domains fit.
    expect(clipped.filter((t) => !/Social-Emotional/.test(t ?? ''))).toEqual([]);
  });

  test('date field shows the app date format and still edits through the native input', async ({ page }) => {
    await page.goto('./#/students/aria/observe');
    const field = page.locator('.date-field');
    await expect(field).toContainText('22 Oct 2026');
    await page.getByLabel('Date observed').fill('2026-10-20');
    await expect(field).toContainText('20 Oct 2026');
  });

  test('studio: panel starts closed (focus mode) and opens on demand; header is one row; filters one row', async ({ page }) => {
    await page.goto('./#/students/aria');
    await expect(page.getByRole('complementary', { name: 'Students sidebar' })).toBeVisible();
    await page.goto('./#/students/aria/studio');
    await expect(page.getByRole('complementary', { name: 'Students sidebar' })).toBeHidden();
    const head = (await page.locator('.studio-head').boundingBox())!;
    expect(head.height).toBeLessThan(100);
    const tops = await page.getByRole('group', { name: 'Filter by domain' }).locator('button').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
    await expect(page.locator('#ai-target option').first()).toHaveText('English 英语');
    await page.getByRole('button', { name: 'Open sidebar' }).click();
    await expect(page.getByRole('complementary', { name: 'Students sidebar' })).toBeVisible();
    // Opening it in the Studio does not change the saved preference elsewhere.
    await page.goto('./#/students/aria');
    await expect(page.getByRole('complementary', { name: 'Students sidebar' })).toBeVisible();
  });

  test('report preview shows the status once outside the status panel', async ({ page }) => {
    await page.goto('./#/students/aria/report');
    await expect(page.locator('.page-head .status')).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'Review' }).locator('.status').first()).toHaveText('Draft');
  });

  test('students table: plain "N days ago" under its heading, no per-row demo label', async ({ page }) => {
    await page.goto('./#/students');
    const list = page.getByRole('region', { name: 'Students in K2 Sunflower' });
    await expect(list.getByText('Demo student')).toHaveCount(0);
    await expect(list.locator('.row-link').first()).toContainText('1 day ago');
    await expect(list.locator('.row-link').first()).not.toContainText('Last observed');
  });
});

test.describe('UI polish · tablet 1024', () => {
  test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  test('Chinese domain names wrap as whole words in English', async ({ page }) => {
    await page.goto('./#/');
    await expect(page.locator('#rp-h')).toBeVisible();
    const split = await page.evaluate(() => {
      const word = '社交与情绪';
      const walker = document.createTreeWalker(document.querySelector('main')!, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      let broken = 0;
      while ((n = walker.nextNode())) {
        const i = n.textContent!.indexOf(word);
        if (i < 0) continue;
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + word.length);
        const tops = new Set([...r.getClientRects()].map((x) => Math.round(x.top)));
        if (tops.size > 1) broken++;
      }
      return broken;
    });
    expect(split).toBe(0);
  });
});
