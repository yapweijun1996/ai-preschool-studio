import { expect, test } from '@playwright/test';

test('approve, release, reopen, resubmit and approve v2 with immutable family copy and audit history', async ({ page }) => {
  await page.addInitScript(() => { sessionStorage.clear(); localStorage.clear(); sessionStorage.setItem('aps-demo-role', 'reviewer'); });
  await page.goto('./#/students/ethan/report');
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.getByText(/v1 · Approved/)).toBeVisible();
  await page.getByRole('button', { name: 'Release to family' }).click();
  await expect(page.getByText('Released to family').first()).toBeVisible();

  await page.getByRole('link', { name: 'Family copy' }).click();
  await expect(page.getByRole('heading', { name: 'Family report' })).toBeVisible();
  const releasedCopy = await page.locator('.family-copy').innerText();
  expect(releasedCopy).not.toContain('OBS-');
  expect(releasedCopy).not.toContain('Reviewer (demo)');
  await page.goto('./#/students/ethan/report');

  await page.getByRole('button', { name: 'Reopen for amendment' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reopen report for amendment' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Reopen report' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByLabel('Reason for reopening').fill('Correct the reflection');
  await dialog.getByRole('button', { name: 'Reopen report' }).click();
  await expect(page.getByText('Report reopened for amendment.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Report status' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Submit for review' })).toHaveCount(0);
  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.getByRole('menuitemradio', { name: 'Teacher', exact: true }).click();
  await page.goto('./#/students/ethan/studio');
  await page.getByLabel('Teacher reflection').fill('Updated after review.');
  await expect(page.getByText(/Saved at/)).toBeVisible();
  await page.getByRole('link', { name: 'Preview PDF' }).click();
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await page.getByRole('button', { name: /Account menu/ }).click();
  await page.getByRole('menuitemradio', { name: 'Reviewer / Principal' }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.getByText(/v2 · Approved/)).toBeVisible();
  await expect(page.getByText('Correct the reflection')).toBeVisible();
  await expect(page.getByText('Report submitted').last()).toBeVisible();
  const versions = page.getByLabel('Report versions');
  await versions.selectOption('1');
  await expect(page.locator('.a4')).not.toContainText('Updated after review.');
  await versions.selectOption('2');

  await page.getByRole('button', { name: 'Release to family' }).click();
  await page.getByRole('link', { name: 'Family copy' }).click();
  await expect(page.locator('.family-copy')).toContainText('Updated after review.');
  await page.goto('./#/audit');
  await expect(page.getByRole('heading', { name: 'Audit log' })).toBeVisible();
  await expect(page.locator('.audit-table-wrap').getByText('Report approved').first()).toBeVisible();
  await expect(page.locator('.audit-table-wrap').getByText('Report released').first()).toBeVisible();
  await expect(page.locator('.audit-table-wrap').getByText('Report reopened').first()).toBeVisible();
});

test('parent cannot reach audit log', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'parent'));
  await page.goto('./#/audit');
  await expect(page.getByText('This role cannot access this page.')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('family copy is empty until a version is released', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'teacher'));
  await page.goto('./#/students/hana/report/family');
  await expect(page.getByText('No report has been released for this child yet.')).toBeVisible();
});
