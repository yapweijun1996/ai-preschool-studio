import { expect, test } from '@playwright/test';
import { CURRENT_FRAMEWORK } from '../src/framework';

test('missing coverage opens observation with that area selected and updates after saving', async ({ page }) => {
  await page.goto('./#/coverage');
  await expect(page.getByRole('heading', { name: 'Evidence coverage' })).toBeVisible();
  const cell = page.locator('.coverage-cell').filter({ has: page.getByText('Missing', { exact: true }) }).first();
  const add = cell.getByRole('link', { name: 'Add observation' });
  const href = await add.getAttribute('href');
  expect(href).toMatch(/\?area=(en|zh|ma|se)$/);
  const area = href!.split('area=')[1] as 'en' | 'zh' | 'ma' | 'se';
  const before = (await cell.locator('.sec.num').textContent())?.trim();
  await add.click();
  const selectedArea = CURRENT_FRAMEWORK.areas.find((item) => item.key === area)!.short.en;
  await expect(page.getByRole('radio', { name: selectedArea })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Save observation' }).click();
  await expect(page.getByText('Observation saved as')).toBeVisible();
  await page.goBack();
  const updated = page.locator('.coverage-table-card').locator(`a[href="${href}"]`).locator('..');
  await expect(updated).toContainText('Thin');
  await expect(updated.locator('.sec.num')).not.toHaveText(before ?? '');
  await expect(updated.locator('.sec.num')).toHaveText('1 observation');
});

test('coverage filter chips select the requested status views', async ({ page }) => {
  await page.goto('./#/coverage');
  await expect(page.locator('#main').getByRole('heading', { name: 'Evidence coverage' })).toBeVisible();
  const filters = page.getByRole('group', { name: 'Filter coverage' });
  await filters.getByRole('button', { name: 'Needs attention' }).click();
  await expect(filters.getByRole('button', { name: 'Needs attention' })).toHaveAttribute('aria-pressed', 'true');
  await filters.getByRole('button', { name: 'Missing', exact: true }).click();
  await expect(filters.getByRole('button', { name: 'Missing', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await filters.getByRole('button', { name: 'Stale', exact: true }).click();
  await expect(filters.getByRole('button', { name: 'Stale', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('mobile coverage uses child cards without the wide table', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/coverage');
  await expect(page.locator('#main').getByRole('heading', { name: 'Evidence coverage' })).toBeVisible();
  await expect(page.locator('.coverage-table-card')).toBeHidden();
  await expect(page.locator('.coverage-mobile-list .coverage-mobile-card').first()).toBeVisible();
  await expect(page.locator('.coverage-mobile-area')).toHaveCount(80);
  await expect(page.getByRole('group', { name: 'Learning areas for Aria Tan' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add observation for Aria Tan, English' })).toBeVisible();
});

test('coverage horizontal table scroll is a named region', async ({ page }) => {
  await page.goto('./#/coverage');
  const tableScroll = page.getByRole('region', { name: 'Evidence coverage by child and learning area' });
  await expect(tableScroll).toBeVisible();
  await expect(tableScroll).not.toHaveAttribute('tabindex', '0');
});

test('review queue is oldest first and opens the selected child report', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'reviewer'));
  await page.goto('./#/reviews');
  const rows = page.locator('.review-row');
  await expect(rows).toHaveCount(4);
  await expect(rows.locator('h2')).toHaveText(['Ethan Koh', 'Daniel Wong', 'Priya Raman', 'Wei Ming Ho']);
  await rows.first().getByRole('link', { name: 'Open report' }).click();
  await expect(page).toHaveURL(/#\/students\/ethan\/report$/);
});

test('parent cannot open coverage or review data', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'parent'));
  for (const path of ['./#/coverage', './#/reviews']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Parent view planned' })).toBeVisible();
    await expect(page.getByText('The family experience will let guardians view released reports, receive notices, manage consents and complete a morning declaration.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evidence coverage' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Review queue' })).toHaveCount(0);
  }
});

test('switching to Parent on coverage and reviews does not trigger a React error', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  for (const path of ['./#/coverage', './#/reviews']) {
    await page.goto(path);
    await page.getByRole('button', { name: /account/i }).click();
    await page.getByRole('menuitemradio', { name: 'Parent', exact: true }).click();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('.notice[role="status"]')).toContainText('Class evidence and review details are available to staff roles.');
    await expect(page.getByRole('button', { name: 'Switch to teacher (demo)' })).toBeVisible();
    await expect(pageErrors).toEqual([]);
    await page.getByRole('button', { name: /account/i }).click();
    await page.getByRole('menuitemradio', { name: 'Teacher', exact: true }).click();
  }
});
