import { expect, test } from '@playwright/test';

const sectionNames = ['Tokens', 'Buttons', 'Status labels', 'SourceChip', 'MilestoneDots', 'Avatar', 'SaveIndicator', 'Notice', 'Chips', 'Tabs', 'Form fields', 'ReportFlow', 'ReadinessList', 'Menu', 'ScrollRow', 'Cards', 'Empty state', 'Skeleton'];

for (const viewport of [{ name: 'desktop 1440x900', width: 1440, height: 900 }, { name: 'mobile 390x844', width: 390, height: 844 }]) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    test('catalog renders sections and exposes rendered markup without console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto('./#/catalog');
      await expect(page.getByRole('heading', { name: 'Component catalog', level: 1 })).toBeVisible();
      for (const heading of sectionNames) await expect(page.getByRole('heading', { name: heading, level: 2 })).toBeVisible();
      await page.getByRole('navigation', { name: 'Catalog sections' }).getByRole('button', { name: 'Buttons' }).click();
      await expect(page).toHaveURL(/#\/catalog$/);
      await expect(page.getByText('We couldn’t find that page')).toHaveCount(0);
      await expect(page.locator('#buttons h2')).toBeInViewport();
      const buttonExample = page.locator('#buttons').getByRole('button', { name: 'Markup' }).first();
      await buttonExample.click();
      await expect(page.locator('#buttons code')).toContainText('btn-primary');
      if (viewport.width === 390) {
        const undersized = await page.locator('button, a[href], input, select, textarea').evaluateAll((els) => els
          .filter((el) => (el as HTMLElement).offsetParent !== null && !(el as HTMLElement).closest('.sr-only'))
          .map((el) => ({ name: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim(), height: el.getBoundingClientRect().height }))
          .filter((el) => el.height < 44));
        expect(undersized).toEqual([]);
      }
      expect(errors).toEqual([]);
    });
  });
}

test('catalog follows dark theme', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('aps-theme', 'dark'));
  await page.goto('./#/catalog');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'Component catalog', level: 1 })).toBeVisible();
});
