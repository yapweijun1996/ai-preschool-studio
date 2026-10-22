import { expect, test } from '@playwright/test';
import { STUDENTS } from '../src/data/demo';

test('desktop account menu switches roles and role persists in this tab', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.getByText(/Viewing as: Teacher/)).toBeVisible();
  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.getByRole('menuitemradio', { name: 'Reviewer / Principal' }).click();
  await expect(page.getByText(/Viewing as: Reviewer \/ Principal/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Viewing as: Reviewer \/ Principal/)).toBeVisible();
});

test('teacher cannot review Ethan and can switch to reviewer', async ({ page }) => {
  await page.goto('./#/students/ethan/report');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
  await expect(page.getByText('Only the reviewer can approve or request changes.')).toBeVisible();
  await page.getByRole('button', { name: 'Switch to reviewer (demo)' }).click();
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeVisible();
});

test('reviewer can approve a ready report and sees Studio read-only', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'reviewer'));
  await page.goto('./#/students/ethan/report');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible();
  await page.goto('./#/students/aria/studio');
  await expect(page.getByText('Reviewer / Principal access is read-only. Only the teacher can edit this draft.')).toBeVisible();
  await expect(page.getByLabel('Teacher reflection')).toHaveAttribute('readonly');
});

test('parent has a planned landing page and no Students navigation', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'parent'));
  await page.goto('./#/');
  await expect(page.getByRole('heading', { name: 'Parent view planned' })).toBeVisible();
  await expect(page.getByText('Family Portal — Phase 3')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Students', exact: true })).toHaveCount(0);
  const plannedCard = page.locator('#planned-purpose').locator('..');
  const returnButton = plannedCard.getByRole('button', { name: 'Switch back to Teacher' });
  const cardWidth = await plannedCard.evaluate((element) => element.getBoundingClientRect().width);
  const buttonWidth = await returnButton.evaluate((element) => element.getBoundingClientRect().width);
  expect(buttonWidth).toBeLessThan(cardWidth - 100);
});

test('parent sees no student names on desktop or mobile, including global search', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'parent'));
  await page.goto('./#/');
  for (const student of STUDENTS) await expect(page.getByText(student.name, { exact: true })).toHaveCount(0);
  await expect(page.getByText('Pinned', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Recent', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: /Search/ }).click();
  const palette = page.getByRole('dialog');
  for (const student of STUDENTS) await expect(palette.getByText(student.name, { exact: true })).toHaveCount(0);
  await expect(palette.getByRole('option')).toHaveCount(2);
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  for (const student of STUDENTS) await expect(page.getByText(student.name, { exact: true })).toHaveCount(0);
});

test('all roles can open personal settings while restricted demo settings explain access', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'parent'));
  await page.goto('./#/');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menu', { name: 'More' }).getByRole('menuitem', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Appearance' })).toBeVisible();
  await page.goto('./#/settings/framework');
  await expect(page.getByRole('heading', { level: 1, name: 'Learning framework' })).toBeVisible();
  await page.goto('./#/settings/demo');
  await expect(page.getByText('Demo data controls are available to teachers and school admins.')).toBeVisible();
  await expect(page.locator('#main').getByRole('link', { name: 'Go to Appearance' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'AI unavailable' })).toHaveCount(0);
  for (const [lang, label] of [['zh', '前往外观设置'], ['ms', 'Pergi ke Penampilan']]) {
    await page.evaluate((value) => localStorage.setItem('aps-lang', value), lang);
    await page.reload();
    await expect(page.locator('#main').getByRole('link', { name: label })).toBeVisible();
  }
});

test('school admin cannot open report narratives', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'admin'));
  await page.goto('./#/students/aria/report');
  await expect(page.getByText('This role cannot access this page.')).toBeVisible();
  await expect(page.getByText('Aria Tan', { exact: true })).toHaveCount(0);
});

test('Studio read-only explanation names the active role', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'admin'));
  await page.goto('./#/students/aria/studio');
  await expect(page.getByText('School admin access is read-only. Only the teacher can edit this draft.')).toBeVisible();
});

test('mobile More sheet switches to parent', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitemradio', { name: 'Parent', exact: true }).click();
  await expect(page.getByText(/Viewing as: Parent/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Parent view planned' })).toBeVisible();
});
