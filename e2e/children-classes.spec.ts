import { expect, test } from '@playwright/test';

test('class roster filters active and withdrawn children and opens a child profile', async ({ page }) => {
  await page.goto('./#/classes');
  await page.getByRole('status', { name: 'Loading class roster…' }).waitFor({ state: 'hidden' });
  const filters = page.getByRole('group', { name: 'Filter children by enrolment status' });
  await expect(filters.getByRole('button', { name: 'Active (20)' })).toHaveAttribute('aria-pressed', 'true');
  await filters.getByRole('button', { name: 'Withdrawn (0)' }).click();
  await expect(page.getByRole('heading', { name: 'No children in this filter' })).toBeVisible();
  await filters.getByRole('button', { name: 'Active (20)' }).click();
  await page.locator('.class-roster').getByRole('link', { name: /Aria Tan/ }).click();
  await expect(page).toHaveURL(/#\/students\/aria$/);
  await expect(page.locator('.family-section')).toBeVisible();
});

test(
  'admin validates and saves guardian, updates collector and child, then audit stays free of sensitive values',
  async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'admin'));
  await page.goto('./#/students/aria');
  const family = page.locator('.family-section');
  await expect(family).toBeVisible();

  await family.getByRole('button', { name: 'Edit child details' }).click();
  const childDialog = page.getByRole('dialog', { name: 'Edit child details' });
  await childDialog.getByLabel('Allergies').fill('Private allergy value e2e only');
  await childDialog.getByRole('button', { name: 'Save' }).click();
  await expect(family).toContainText('Private allergy value e2e only');

  await family.getByRole('button', { name: 'Add guardian' }).click();
  const guardianDialog = page.getByRole('dialog', { name: 'Guardian details' });
  await guardianDialog.getByRole('button', { name: 'Save' }).click();
  await expect(guardianDialog.getByRole('alert')).toContainText('Check the highlighted fields and try again.');
  await expect(guardianDialog.getByLabel('Guardian name')).toHaveAttribute('aria-invalid', 'true');
  await guardianDialog.getByLabel('Guardian name').fill('Fictional Guardian E2E');
  await guardianDialog.getByLabel('Relationship').fill('Parent');
  await guardianDialog.getByLabel('Phone').fill('+65 9000 8888');
  await guardianDialog.getByLabel('Email').fill('private-contact@example.com');
  await guardianDialog.getByRole('button', { name: 'Save' }).click();
  await expect(family.getByText('Fictional Guardian E2E')).toBeVisible();
  await expect(family.getByText('private-contact@example.com')).toBeVisible();

  const collectors = family.locator('.family-subsection').filter({
    has: page.getByRole('heading', { name: 'Authorised collectors' })
  });
  await collectors.getByRole('button', { name: 'Edit' }).click();
  const collectorDialog = page.getByRole('dialog', { name: 'Authorised collector details' });
  await collectorDialog.getByLabel('Collector name').fill('Fictional Collector E2E updated');
  await collectorDialog.getByRole('button', { name: 'Save' }).click();
  await expect(collectors.getByText('Fictional Collector E2E updated')).toBeVisible();

  await page.goto('./#/audit');
  const table = page.locator('.audit-table-wrap');
  await expect(table.getByText('Child record updated')).toBeVisible();
  await expect(table.getByRole('cell', { name: 'Guardian added.', exact: true })).toBeVisible();
  await expect(table.getByRole('cell', { name: 'Authorised collector updated.', exact: true })).toBeVisible();
  await expect(table).toContainText('Aria Tan');
  await expect(table).not.toContainText('Private allergy value e2e only');
  await expect(table).not.toContainText('private-contact@example.com');
  await expect(table).not.toContainText('+65 9000 8888');
  }
);

test('school admin sees the typed reason when withdrawal is blocked by an in-review report', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'admin'));
  await page.goto('./#/students/ethan');
  const family = page.locator('.family-section');
  await family.getByRole('button', { name: 'Withdraw child' }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirm withdrawal' });
  await dialog.getByRole('button', { name: 'Confirm' }).click();
  await expect(dialog.getByRole('alert')).toContainText('This child cannot be withdrawn while a report is in review.');
  await expect(family.getByText('Active', { exact: true })).toBeVisible();
});

test('an open collector editor cannot move Aria’s record to Chloe after route navigation', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'admin'));
  await page.goto('./#/students/aria');
  const family = page.locator('.family-section');
  const collectors = family.locator('.family-subsection').filter({ has: page.getByRole('heading', { name: 'Authorised collectors' }) });
  await collectors.getByRole('button', { name: 'Edit' }).click();
  const dialog = page.getByRole('dialog', { name: 'Authorised collector details' });
  await page.goto('./#/students/chloe');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.family-section').locator('.family-subsection').filter({ has: page.getByRole('heading', { name: 'Authorised collectors' }) }).getByText('Fictional Collector 01')).toHaveCount(0);
  await page.goto('./#/students/aria');
  await expect(page.locator('.family-section').getByText('Fictional Collector 01')).toBeVisible();
  await page.goto('./#/audit');
  await expect(page.locator('.audit-table-wrap')).not.toContainText('Chloe Ng');
});

test('confirmation dialogs manage initial focus, Escape, Tab, and focus return', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'admin'));
  await page.goto('./#/students/aria');
  const trigger = page.locator('.family-section').getByRole('button', { name: 'Withdraw child' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Confirm withdrawal' });
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Confirm' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('teacher sees guardian contacts and health notes but has no edit actions', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'teacher'));
  await page.goto('./#/students/aria');
  const family = page.locator('.family-section');
  await expect(family.getByText('Fictional Guardian 01')).toBeVisible();
  await expect(family.getByText('+65 9000 1000')).toBeVisible();
  await expect(family.getByText('Fictional note: mild pollen sensitivity.')).toBeVisible();
  await expect(family.getByRole('button', { name: /Edit|Add guardian|Add collector|Withdraw child/ })).toHaveCount(0);
  await expect(family.getByText('Only school admins can edit child and family records.')).toBeVisible();
});

test('reviewer sees child basics but no guardian contacts or health notes', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'reviewer'));
  await page.goto('./#/students/aria');
  const family = page.locator('.family-section');
  await expect(family.getByText('K2 Sunflower')).toBeVisible();
  await expect(family.getByText('Contact details are restricted for this role.')).toHaveCount(2);
  await expect(family.getByText('Restricted — visible to teachers and school admins.')).toBeVisible();
  await expect(family.getByText('Fictional Guardian 01')).toHaveCount(0);
  await expect(family.getByText('+65 9000 1000')).toHaveCount(0);
  await expect(family.getByText('Fictional note: mild pollen sensitivity.')).toHaveCount(0);
});

test('parent cannot open class roster or child profile', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('aps-demo-role', 'parent'));
  await page.goto('./#/classes');
  await expect(page.getByText('This role cannot access this page.')).toBeVisible();
  await expect(page.getByText('Aria Tan', { exact: true })).toHaveCount(0);
  await page.goto('./#/students/aria');
  await expect(page.getByText('This role cannot access this page.')).toBeVisible();
  await expect(page.getByText('Aria Tan', { exact: true })).toHaveCount(0);
});
