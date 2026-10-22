import { expect, test } from '@playwright/test';

async function expectDecorativeIllustrations(page: import('@playwright/test').Page) {
  const images = page.locator('img.empty-illustration');
  await expect(images.first()).toBeVisible();
  for (const image of await images.all()) {
    await expect(image).toHaveAttribute('alt', '');
    await expect(image).toHaveAttribute('aria-hidden', 'true');
  }
}

test('empty state illustrations are present and decorative', async ({ page }) => {
  await page.goto('./#/students');
  await page.getByRole('searchbox', { name: 'Search students' }).fill('no matching student');
  await expectDecorativeIllustrations(page);

  await page.goto('./#/not-a-real-route');
  await expectDecorativeIllustrations(page);

  for (const role of ['parent', 'admin']) {
    await page.goto('./#/');
    await page.evaluate((value) => sessionStorage.setItem('aps-demo-role', value), role);
    await page.reload();
    await expectDecorativeIllustrations(page);
  }
});

test('sample photo slots show a caption and meaningful alt text', async ({ page }) => {
  await page.goto('./#/students/aria/studio');
  const photoSlots = page.locator('.ev-card .photo-illustration');
  await expect(photoSlots.first()).toBeVisible();
  for (const slot of await photoSlots.all()) {
    await expect(slot.locator('img')).not.toHaveAttribute('alt', '');
    await expect(slot.getByText('Sample illustration — not a real photo')).toBeVisible();
  }

  await page.goto('./#/students/aria/report');
  const reportPhoto = page.locator('.photo-illustration-report');
  await expect(reportPhoto.locator('img')).not.toHaveAttribute('alt', '');
  await expect(reportPhoto.getByText('Sample illustration — not a real photo')).toBeVisible();
});
