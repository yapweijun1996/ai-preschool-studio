import { expect, test } from '@playwright/test';

const shot = (name: string) => ({ path: `test-results/screens/${name}.png`, fullPage: true });

test.describe('desktop 1440 journey', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('dashboard → students → profile → observation → progress → studio → report → approve', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Demo mode — all students and observations are fictional sample data')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Good morning, Ms. Lim' })).toBeVisible();
    await page.screenshot(shot('01-dashboard'));

    await page.getByRole('link', { name: 'Students', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'My Students' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Aria Tan/ }).first()).toBeVisible();
    await page.screenshot(shot('02-students'));

    await page.getByRole('main').getByRole('link', { name: /Aria Tan/ }).click();
    await expect(page.getByRole('heading', { name: 'Aria Tan' })).toBeVisible();
    await page.screenshot(shot('03-profile'));

    await page.getByRole('main').getByRole('link', { name: 'Add observation' }).click();
    await page.getByRole('button', { name: 'Save observation' }).click();
    await expect(page.getByText('Observation saved as')).toBeVisible();
    await expect(page.getByText('OBS-0158')).toBeVisible();
    await page.screenshot(shot('04-observation-saved'));

    await page.getByRole('link', { name: 'View learning progress' }).click();
    await expect(page.getByRole('heading', { name: 'Learning progress' })).toBeVisible();
    await expect(page.getByText('Consistently demonstrated').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText('%');
    await page.screenshot(shot('05-progress'));

    await page.getByRole('main').getByRole('link', { name: 'Open AI Portfolio Studio' }).click();
    await expect(page.getByRole('heading', { name: 'AI Portfolio Studio' })).toBeVisible();
    await expect(page.getByText('Mock provider').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('2 claims need teacher verification')).toBeVisible();
    await page.screenshot(shot('06-studio'));

    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('1 claim needs teacher verification').first()).toBeVisible();
    await page.getByRole('button', { name: 'Submit for review' }).click();

    await expect(page.getByRole('heading', { name: 'Report preview' })).toBeVisible();
    await expect(page.getByText('Approval blocked')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveAttribute('aria-disabled', 'true');
    await page.screenshot(shot('07-report-blocked'));

    await page.getByRole('button', { name: 'Link evidence' }).click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export PDF / Print' })).toBeVisible();
    await page.screenshot(shot('08-approved'));
  });

  test('AI unavailable and save failed states', async ({ page }) => {
    await page.goto('/#/students/aria/studio');
    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('button', { name: 'Simulate AI unavailable' }).click();
    await page.getByRole('button', { name: 'Simulate save failure' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Shorten' }).click();
    await expect(page.getByText('AI Assistant unavailable')).toBeVisible();
    await page.getByLabel('Teacher reflection').fill('Updated reflection.');
    await expect(page.getByText('Save failed').first()).toBeVisible({ timeout: 5000 });
    await page.screenshot(shot('09-studio-failures'));
  });

  test('dark theme', async ({ page }) => {
    await page.goto('/#/students/aria/studio');
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible({ timeout: 5000 });
    await page.screenshot(shot('10-studio-dark'));
  });
});

test.describe('tablet 1024', () => {
  test.use({ viewport: { width: 1024, height: 860 } });
  test('studio uses drawers', async ({ page }) => {
    await page.goto('/#/students/aria/studio');
    await expect(page.getByRole('complementary', { name: 'AI Assistant' })).toBeVisible();
    await page.screenshot(shot('11-studio-tablet'));
    await page.goto('/#/students');
    await page.screenshot(shot('12-students-tablet'));
  });
});

test.describe('mobile 390', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('studio tabs and students list', async ({ page }) => {
    await page.goto('/#/students');
    await expect(page.getByText('Demo mode · fictional sample data')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await page.screenshot(shot('13-students-mobile'));
    await page.goto('/#/students/aria/studio');
    await page.getByRole('tab', { name: 'AI' }).click();
    await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible({ timeout: 5000 });
    await page.screenshot(shot('14-studio-mobile-ai'));
    await page.getByRole('tab', { name: 'Evidence' }).click();
    await expect(page.getByText('OBS-0151').first()).toBeVisible();
  });

  test('every control meets the 44px touch target', async ({ page }) => {
    await page.goto('/#/students/aria/studio');
    await expect(page.getByRole('tab', { name: 'Write' })).toBeVisible();
    const small = await page.$$eval('button, a[href], input, select, textarea', (els) =>
      els
        .filter((e) => (e as HTMLElement).offsetParent !== null && !e.closest('.sr-only'))
        .map((e) => ({ t: (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30), h: e.getBoundingClientRect().height }))
        .filter((x) => x.h < 44)
    );
    expect(small).toEqual([]);
  });
});
