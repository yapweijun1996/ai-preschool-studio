import { expect, test } from '@playwright/test';

const open = async (
  page: import('@playwright/test').Page,
  path = './#/attendance',
  role?: string,
) => {
  if (role)
    await page.addInitScript((value) => sessionStorage.setItem('aps-demo-role', value), role);
  await page.goto(path);
};

const row = (page: import('@playwright/test').Page, name: string) =>
  page.locator('#main .attendance-row').filter({ hasText: name });

test('teacher marks present, absent with required reason, changes a mark, and confirms bulk mark', async ({
  page,
}) => {
  await open(page);
  const aiden = row(page, 'Aiden Lee');
  await expect(page.getByRole('region', { name: 'Attendance summary' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Today’s attendance register' })).toBeVisible();
  await expect(aiden.getByRole('button', { name: 'Mark Aiden Lee present' })).toBeVisible();
  await expect(aiden.getByRole('button', { name: 'Mark Aiden Lee absent' })).toBeVisible();
  await expect(
    aiden.getByRole('button', { name: 'Set time — Set arrival time for Aiden Lee' }),
  ).toBeVisible();
  await aiden.getByRole('button', { name: 'Mark Aiden Lee present' }).click();
  await expect(aiden).toContainText('Present');
  await expect(aiden.locator('.attendance-child > strong')).toBeFocused();
  const siti = row(page, 'Siti Aminah');
  await siti.getByRole('button', { name: 'Mark Siti Aminah absent' }).click();
  const absence = page.getByRole('dialog', { name: 'Mark Siti Aminah absent' });
  await absence.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(absence.getByRole('alert')).toContainText('Choose an absence reason');
  await absence.getByRole('radio', { name: 'Sick' }).check();
  await absence.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(siti.getByText('Absent', { exact: true })).toBeVisible();
  await expect(siti.locator('.attendance-child > strong')).toBeFocused();

  const aria = row(page, 'Aria Tan');
  await aria.getByRole('button', { name: 'Change attendance for Aria Tan' }).click();
  const amend = page.getByRole('dialog', { name: 'Change attendance for Aria Tan' });
  await expect(amend.locator('#amend-field')).toHaveAccessibleName('Change');
  await expect(amend.locator('#amend-field')).toHaveValue('status');
  await expect(amend.getByRole('button', { name: 'Save change' })).toBeDisabled();
  await expect(amend.getByRole('status')).toHaveCount(0);
  await amend.locator('#amend-value').selectOption('absent');
  await amend.getByRole('button', { name: 'Save change' }).click();
  await expect(amend.getByRole('alert')).toContainText('Choose an absence reason');
  await expect(amend.getByRole('alert')).not.toContainText('Enter a reason between');
  await amend.locator('#amend-value').selectOption('present');
  await expect(amend.getByRole('status')).toContainText('differs from the current value');
  await amend.locator('#amend-field').selectOption('arrivedAt');
  await expect(amend.locator('#amend-value')).toHaveAccessibleName('Arrival time');
  await amend.locator('#amend-value').fill('23:59');
  await amend
    .getByLabel('Reason for this change')
    .fill('Corrected against the fictional paper register.');
  await amend.getByRole('button', { name: 'Save change' }).click();
  await expect(amend).toBeVisible();
  await expect(amend.getByLabel('Reason for this change')).toHaveValue(
    'Corrected against the fictional paper register.',
  );
  await expect(amend.getByRole('alert')).toContainText('not in the future');
  await amend.locator('#amend-value').fill('08:00');
  await amend.getByRole('button', { name: 'Save change' }).click();
  await expect(aria.locator('.attendance-child > strong')).toBeFocused();
  await page.getByRole('link', { name: 'History' }).click();
  await page.locator('#history-date').selectOption('2026-10-22');
  const historyAria = row(page, 'Aria Tan');
  await historyAria.locator('details summary').click();
  await expect(historyAria).toContainText('Corrected against the fictional paper register.');

  await page.getByRole('link', { name: 'Today' }).click();
  await page.getByRole('button', { name: /Not marked/ }).click();
  const timeRow = page.locator('#main .attendance-row').first();
  await timeRow.getByRole('button', { name: /^Set time — Set arrival time for/ }).click();
  await expect(timeRow.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(timeRow.getByRole('button', { name: /^Save arrival time for/ })).toHaveText('Save');
  await timeRow.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Mark remaining present' }).click();
  const bulk = page.getByRole('dialog', { name: 'Mark remaining children present?' });
  await expect(bulk).toContainText('remaining children present');
  await expect(bulk).toContainText('at 09:00');
  await expect(bulk).toContainText('after 08:30 are recorded as late');
  await bulk.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('status').last()).toContainText('Attendance saved');
  await expect(page.locator('.attendance-stat.stat-notMarked strong')).toHaveText('0');
  await expect(page.locator('.attendance-summary')).toBeFocused();
  await page.getByRole('button', { name: /Not marked/ }).click();
  await expect(page.getByText('Everyone is marked.')).toBeVisible();
});

test('filters and summary counts update after marking; reviewer is read-only; parent is denied', async ({
  page,
}) => {
  await open(page);
  await expect(page.locator('#main .attendance-list[aria-busy="false"]')).toBeVisible();
  const initialNotMarked = Number(
    await page.locator('.attendance-stat.stat-notMarked strong').innerText(),
  );
  await row(page, 'Aiden Lee').getByRole('button', { name: 'Mark Aiden Lee present' }).click();
  await expect(page.locator('.attendance-stat.stat-present strong')).toHaveText('13');
  await expect(page.locator('.attendance-stat.stat-present .attendance-late-count')).toBeVisible();
  await page.getByRole('button', { name: /Late/ }).click();
  await expect(page.locator('.attendance-row')).toHaveCount(3);
  await expect(page.locator('.attendance-row').first().locator('.attendance-status')).toHaveText('Present');
  await expect(page.locator('.attendance-row').first().locator('.attendance-late-badge')).toHaveText('Late');
  await page.getByRole('button', { name: /Not marked/ }).click();
  await expect(page.locator('.attendance-row')).toHaveCount(initialNotMarked - 1);

  const reviewer = await page.context().newPage();
  await open(reviewer, './#/attendance', 'reviewer');
  await expect(reviewer.getByText('Read-only: this role can view attendance')).toBeVisible();
  await expect(reviewer.getByRole('button', { name: 'Mark remaining present' })).toHaveCount(0);
  await expect(
    reviewer.locator('.attendance-row').getByRole('button', { name: /^Mark .* present$/ }),
  ).toHaveCount(0);
  const parent = await page.context().newPage();
  await open(parent, './#/attendance', 'parent');
  await expect(parent.getByText('This role cannot access this page.')).toBeVisible();
});

test('kiosk PIN locks after three failures, QR scan works, and Face is unavailable', async ({
  page,
}) => {
  await open(page, './#/attendance/kiosk');
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('search')).toHaveCount(0);
  await expect(page.getByText('Kiosk mode (demo)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Present', exact: true })).toHaveCount(0);
  await expect(page.getByText('Show fictional demo credentials')).toBeVisible();
  await expect(page.locator('.kiosk-credentials')).not.toHaveAttribute('open', '');
  await expect(page.locator('.kiosk-credentials summary')).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('tab', { name: 'PIN' }).click();
  await expect(page.getByRole('tab', { name: 'PIN' })).toHaveAttribute('tabindex', '0');
  await expect(page.getByRole('tab', { name: 'QR' })).toHaveAttribute('tabindex', '-1');
  await page.getByRole('tab', { name: 'PIN' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'QR' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'QR' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Face (unavailable)' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'PIN' })).toBeFocused();
  await expect(page.getByLabel('Child code')).toHaveAttribute('inputmode', 'text');
  await expect(page.getByLabel('Child code')).toHaveAttribute('autocapitalize', 'characters');
  await expect(page.getByLabel('Child code')).toHaveAttribute('pattern', '[A-Z]{2}-[0-9]{4}');
  await expect(page.getByLabel('4-digit PIN')).toHaveAttribute('inputmode', 'numeric');
  await page.getByLabel('Child code').fill('FC-1001');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel('4-digit PIN').fill('9999');
    await page.getByRole('button', { name: 'Check in', exact: true }).click();
    if (attempt < 2) {
      await expect(page.getByRole('alert')).toContainText(attempt === 0 ? '2 attempts left' : '1 attempt left');
      await expect(page.getByRole('alert')).toContainText('Code or PIN not recognised');
    }
  }
  await expect(page.getByRole('alert')).toContainText('locked');
  await expect(page.getByRole('alert')).toContainText('5 minutes');
  await expect(page.getByLabel('4-digit PIN')).toHaveValue('');
  await page.getByRole('tab', { name: 'QR' }).click();
  await page.getByRole('button', { name: /QR-FIC-0014/ }).click();
  await expect(page.locator('#kiosk-panel .kiosk-success')).toContainText('checked in at');
  await expect(page.locator('.kiosk-success h2')).toBeFocused();
  await page.getByRole('button', { name: 'Next family' }).click();
  await expect(page.locator('.kiosk-card-list button').first()).toBeFocused();
  await page.getByRole('tab', { name: 'PIN' }).click();
  await expect(page.getByLabel('Child code')).toHaveValue('');
  await page.getByLabel('Child code').fill('FC-1015');
  await page.getByLabel('4-digit PIN').fill('3333');
  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await expect(page.locator('.kiosk-success h2')).toBeFocused();
  await page.waitForTimeout(5100);
  await expect(page.getByLabel('Child code')).toHaveValue('');
  await expect(page.getByLabel('Child code')).toBeFocused();
  await page.getByRole('tab', { name: 'PIN' }).click();
  await page.getByRole('tab', { name: 'Face (unavailable)' }).click();
  await expect(page.getByText(/face-match consent is not recorded and the school has not enabled it/)).toBeVisible();
  await expect(page.getByText(/Use PIN or QR, or ask a staff member/)).toBeVisible();
});

test('exiting kiosk requires fictional staff PIN and locks after three failures', async ({ page }) => {
  await open(page, './#/attendance/kiosk');
  await page.locator('.kiosk-credentials summary').click();
  await expect(page.locator('.kiosk-credentials')).toHaveAttribute('open', '');
  await expect(page.locator('.kiosk-credentials summary')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(/Fictional demo staff PIN: 8642/)).toBeVisible();
  await page.getByRole('button', { name: 'Exit kiosk' }).click();
  const dialog = page.getByRole('dialog', { name: 'Staff verification required' });
  await expect(dialog.getByLabel('Staff PIN')).toBeFocused();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await dialog.getByLabel('Staff PIN').fill('1111');
    await dialog.getByRole('button', { name: 'Verify and exit' }).click();
    if (attempt < 2) {
      await expect(dialog.getByRole('alert')).toContainText(
        attempt === 0 ? '2 attempts left' : '1 attempt left',
      );
    }
  }
  await expect(dialog.getByRole('alert')).toContainText('locked after 3 failed attempts');
  await expect(page).toHaveURL(/#\/attendance\/kiosk$/);
  await page.reload();
  await page.getByRole('button', { name: 'Exit kiosk' }).click();
  await page.getByLabel('Staff PIN').fill('8642');
  await page.getByRole('button', { name: 'Verify and exit' }).click();
  await expect(page).toHaveURL(/#\/attendance$/);
});

test('kiosk method tabs fit at mobile width in all supported languages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const lang of ['en', 'zh', 'ms']) {
    await open(page, './#/attendance/kiosk');
    await page.evaluate((language) => localStorage.setItem('aps-lang', language), lang);
    await page.reload();
    const face = page.getByRole('tab', {
      name: lang === 'en'
        ? 'Face (unavailable)'
        : lang === 'zh'
          ? '人脸（不可用）'
          : 'Wajah (tidak tersedia)',
    });
    await expect(face).toBeVisible();
    const metrics = await page.locator('.attendance-kiosk-tabs button').evaluateAll((buttons) =>
      buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          height: rect.height,
          width: rect.width,
          clientWidth: button.clientWidth,
          scrollWidth: button.scrollWidth,
        };
      }),
    );
    expect(metrics).toHaveLength(3);
    for (const item of metrics) {
      expect(item.height).toBeGreaterThanOrEqual(44);
      expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
    }
  }
});

test('mobile attendance chips stay centered and summary counts align in Malay', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.evaluate(() => localStorage.setItem('aps-lang', 'ms'));
  await page.reload();
  const notMarked = page.getByRole('button', { name: /Belum ditandakan/ });
  await expect(notMarked).toBeVisible();
  const chipText = await notMarked.evaluate((button) => {
    const rect = button.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(button);
    const text = range.getBoundingClientRect();
    return { button: rect, text };
  });
  expect(chipText.text.top + chipText.text.height / 2).toBeGreaterThanOrEqual(
    chipText.button.top + chipText.button.height / 2 - 2,
  );
  expect(chipText.text.top + chipText.text.height / 2).toBeLessThanOrEqual(
    chipText.button.top + chipText.button.height / 2 + 2,
  );
  expect(await notMarked.evaluate((button) => button.scrollWidth <= button.clientWidth)).toBe(true);
  for (const path of ['./#/attendance', './#/attendance/history']) {
    if (path.endsWith('/history')) await page.goto(path);
    const tops = await page.locator('.attendance-stat strong').evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().top),
    );
    expect(tops).toHaveLength(4);
    expect(Math.abs(tops[0] - tops[1])).toBeLessThanOrEqual(1);
    expect(Math.abs(tops[2] - tops[3])).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const path of ['./#/attendance', './#/attendance/history']) {
    await page.goto(path);
    const tops = await page.locator('.attendance-stat strong').evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().top),
    );
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1);
  }
});

test('legacy check-in route redirects; reviewer sees a read-only kiosk explanation', async ({
  page,
}) => {
  await open(page, './#/attendance/check-in');
  await expect(page).toHaveURL(/#\/attendance\/kiosk$/);
  const reviewer = await page.context().newPage();
  await open(reviewer, './#/attendance/kiosk', 'reviewer');
  await expect(reviewer.getByText('This role cannot access this page.')).toBeVisible();
  await expect(reviewer.getByRole('tab')).toHaveCount(0);
  await expect(reviewer.getByRole('button', { name: /check in|present/i })).toHaveCount(0);
});

test('admin can amend a past day; teacher cannot amend a past day', async ({ page }) => {
  await open(page, './#/attendance/history', 'admin');
  await expect(page.locator('#history-date')).toHaveValue(/2026-10-/);
  await expect(page.getByLabel('School day')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Attendance summary' })).toBeVisible();
  await page.locator('#history-date').selectOption('2026-10-22');
  await expect(page.getByText('Today’s attendance is on the live register:')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View register' })).toBeVisible();
  await page.locator('#history-date').selectOption('2026-10-21');
  const target = page.locator('#main .attendance-row').filter({ hasText: 'Aria Tan' });
  await expect(row(page, 'Ethan Koh').locator('details')).toHaveCount(0);
  await target.getByRole('button', { name: 'Amend Aria Tan' }).click();
  const dialog = page.getByRole('dialog', { name: 'Change attendance for Aria Tan' });
  await expect(dialog.locator('#amend-field')).toHaveAccessibleName('Change');
  await dialog.locator('#amend-field').selectOption('arrivedAt');
  await expect(dialog.locator('#amend-value')).toHaveAccessibleName('Arrival time');
  await dialog.locator('#amend-value').fill('08:00');
  await dialog
    .getByLabel('Reason for this change')
    .fill('Fictional historical correction for acceptance.');
  await dialog.getByRole('button', { name: 'Save change' }).click();
  await expect(target.locator('[data-attendance-child="aria"]')).toBeFocused();
  await expect(page.getByRole('status').last()).toContainText('amendment saved');
  await target.locator('details summary').click();
  await expect(target).toContainText('Fictional historical correction for acceptance.');
  await expect(target).toContainText('Ms. Wong · 22 Oct 2026 09:00');

  const teacher = await page.context().newPage();
  await open(teacher, './#/attendance/history', 'teacher');
  await expect(
    teacher
      .locator('#main .attendance-row')
      .filter({ hasText: 'Aria Tan' })
      .getByRole('button', { name: 'Amend Aria Tan' }),
  ).toHaveCount(0);
});

test('keyboard absence dialog traps focus, Escape closes it, and focus returns to trigger', async ({
  page,
}) => {
  await open(page);
  const target = row(page, 'Aiden Lee');
  const trigger = target.getByRole('button', { name: 'Mark Aiden Lee absent' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Mark Aiden Lee absent' });
  await expect(dialog).toBeVisible();
  const buttons = dialog.getByRole('button');
  await buttons.last().focus();
  await page.keyboard.press('Tab');
  await expect(dialog.locator('input[type="radio"]').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('attendance dialogs are centered overlays that block page actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const target = row(page, 'Aiden Lee');
  await target.getByRole('button', { name: 'Mark Aiden Lee absent' }).click();
  const dialog = page.getByRole('dialog', { name: 'Mark Aiden Lee absent' });
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs(box!.x + box!.width / 2 - viewport!.width / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(box!.y + box!.height / 2 - viewport!.height / 2)).toBeLessThanOrEqual(1);
  expect(box!.width).toBe(358);

  await expect(target.getByRole('button', { name: 'Mark Aiden Lee present' })).toBeVisible();
  await expect(
    target
      .getByRole('button', { name: 'Mark Aiden Lee present' })
      .click({ trial: true, timeout: 500 }),
  ).rejects.toThrow();
  await expect(target.getByText('Not marked', { exact: true })).toBeVisible();
  await expect(dialog).toBeVisible();
});

test('mobile tab bar has Attendance and More contains Add observation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Attendance' })).toBeVisible();
  await nav.getByRole('button', { name: 'More' }).click();
  await expect(
    page.getByRole('menu', { name: 'More' }).getByRole('menuitem', { name: 'Add observation' }),
  ).toBeVisible();
});

test('mobile attendance controls keep their targets and credential labels visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const aria = row(page, 'Aria Tan');
  const change = aria.getByRole('button', { name: 'Change attendance for Aria Tan' });
  expect((await change.boundingBox())?.width).toBeGreaterThan(320);

  await page.goto('./#/attendance/history');
  await page.locator('#history-date').selectOption('2026-10-12');
  const trail = page.locator('.amendment-details summary').first();
  expect((await trail.boundingBox())?.height).toBeGreaterThanOrEqual(44);

  await page.goto('./#/attendance/kiosk');
  await page.getByText('Show fictional demo credentials').click();
  const code = page.locator('.credential-row code').first();
  await expect(code).toHaveAttribute('data-label', 'Code');
  await expect
    .poll(() => code.evaluate((element) => getComputedStyle(element, '::before').content))
    .toMatch(/"Code"|attr\(data-label\)/);
});

test('dashboard attendance tile is limited to teachers and admins', async ({ page }) => {
  await open(page, './#/', 'teacher');
  await expect(page.locator('.attendance-dashboard-tile')).toBeVisible();
  const admin = await page.context().newPage();
  await open(admin, './#/', 'admin');
  await expect(admin.locator('.attendance-dashboard-tile')).toBeVisible();
  const reviewer = await page.context().newPage();
  await open(reviewer, './#/', 'reviewer');
  await expect(reviewer.locator('.attendance-dashboard-tile')).toHaveCount(0);
});
