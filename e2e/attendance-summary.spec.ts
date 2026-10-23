import { expect, test } from '@playwright/test';

test('attendance summaries load their styles on dashboard and profile cold loads', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'teacher'));
  await page.goto('./#/');

  const counts = page.locator('.attendance-tile-counts');
  await expect(counts).toBeVisible();
  await expect.poll(() => counts.evaluate((element) => getComputedStyle(element).display)).toBe('grid');
  await expect
    .poll(() =>
      counts.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
    )
    .toBe(4);

  const countItems = counts.locator(':scope > div');
  await expect(countItems).toHaveCount(4);
  for (const item of await countItems.all()) {
    const label = await item.locator('span').boundingBox();
    const number = await item.locator('strong').boundingBox();
    expect(label).not.toBeNull();
    expect(number).not.toBeNull();
    expect(label!.y + label!.height).toBeLessThanOrEqual(number!.y);
  }

  await page.goto('./#/students/aria');
  const strip = page.locator('.attendance-day-strip');
  await expect(strip).toBeVisible();
  const chips = await strip.locator(':scope > .attendance-day').all();
  expect(chips.length).toBeGreaterThan(0);
  const chipBoxes = await Promise.all(chips.map((chip) => chip.boundingBox()));
  expect(chipBoxes.every((box) => box !== null)).toBe(true);
  expect(new Set(chipBoxes.map((box) => Math.round(box!.y))).size).toBe(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/');
  await expect(counts).toBeVisible();
  await expect
    .poll(() =>
      counts.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
    )
    .toBe(2);

  await page.goto('./#/students/aria');
  await expect(strip).toBeVisible();
  await expect
    .poll(() => strip.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
