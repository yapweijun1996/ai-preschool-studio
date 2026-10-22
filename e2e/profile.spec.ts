import { expect, test } from '@playwright/test';

const shot = (name: string) => ({ path: `test-results/screens/${name}.png`, fullPage: true });

test.describe('profile · wide 1920', () => {
  test.use({ viewport: { width: 1920, height: 1000 } });

  test('all four domains share one row; report card shows the flow and links to the claims', async ({ page }) => {
    await page.goto('./#/students/aria');
    const cards = page.locator('.domain-grid > article');
    await expect(cards).toHaveCount(4);
    const tops = await cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);

    const report = page.getByRole('region', { name: 'Portfolio report' });
    const flow = report.getByRole('list', { name: 'Report flow' });
    await expect(flow.getByRole('listitem')).toHaveCount(4);
    await expect(flow.locator('[aria-current="step"]')).toContainText('Draft');
    await page.screenshot(shot('40-profile-1920'));

    await report.getByRole('link', { name: 'Review claims in Studio' }).click();
    await expect(page).toHaveURL(/#\/students\/aria\/studio\?focus=claims$/);
    const claim = page.locator('[data-claim]').first();
    await expect(claim).toBeFocused();
    await expect(claim).toBeInViewport();
    // Only the narrative panel scrolls; the studio header stays in view.
    await expect(page.getByRole('heading', { name: 'AI Portfolio Studio', level: 1 })).toBeInViewport();
  });

  test('pin is a ghost toggle that fills when pinned', async ({ page }) => {
    await page.goto('./#/students/ethan');
    const pin = page.getByRole('button', { name: 'Pin to sidebar' });
    await expect(pin).toHaveAttribute('aria-pressed', 'false');
    const off = await pin.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(off).toBe('rgba(0, 0, 0, 0)');
    await pin.click();
    const on = page.getByRole('button', { name: 'Unpin from sidebar' });
    await expect(on).toHaveAttribute('aria-pressed', 'true');
    expect(await on.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgba(0, 0, 0, 0)');
    expect(await on.locator('path').last().evaluate((el) => getComputedStyle(el).fill)).not.toBe('none');
    await expect(page.getByRole('complementary', { name: 'Students sidebar' }).getByText('Ethan Koh').first()).toBeVisible();
  });
});

test.describe('profile · 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('domains stay two per row when the column is narrower', async ({ page }) => {
    await page.goto('./#/students/aria');
    const tops = await page.locator('.domain-grid > article').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(2);
  });
});

test.describe('profile · mobile 390', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('header stays on one line and the claims link is reachable', async ({ page }) => {
    await page.goto('./#/students/aria');
    const head = page.locator('.profile-head');
    const box = await head.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(80);
    await expect(page.getByRole('link', { name: 'Review claims in Studio' })).toBeVisible();
    const small = await page.$$eval('main .page button, main .page a[href]', (els) =>
      els.filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => e.getBoundingClientRect().height).filter((h) => h < 44));
    expect(small).toEqual([]);
  });
});
