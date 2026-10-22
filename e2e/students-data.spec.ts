import { expect, test } from '@playwright/test';

// Every one of the 20 demo students: numbers agree across pages, checks never claim what the report lacks.
const IDS = ['aria', 'ethan', 'meiling', 'rayan', 'sofia', 'daniel', 'hana', 'arjun', 'zoe', 'lucas', 'nuraisyah', 'kai', 'priya', 'aiden', 'siti', 'chloe', 'irfan', 'weiming', 'isabelle', 'rohan'];

test.describe('all students · desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('students list shows 20; counts match each studio evidence panel', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('./#/students');
    await expect(page.getByText('20 students')).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Students sidebar' }).getByRole('link', { name: /K2 Sunflower/ })).toContainText('20');
    const rows = page.getByRole('region', { name: 'Students in K2 Sunflower' }).locator('.row-link');
    await expect(rows).toHaveCount(20);
    const listed: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      const href = (await rows.nth(i).getAttribute('href'))!;
      const n = Number((await rows.nth(i).textContent())!.match(/(\d+) observations?/)![1]);
      listed[href.split('/').pop()!] = n;
    }
    for (const id of IDS) {
      await page.goto(`./#/students/${id}/studio`);
      const label = n(listed[id]);
      await expect(page.getByRole('region', { name: 'Evidence' }).getByText(`${label} · Term 4`)).toBeVisible();
      await expect(page.getByText('Aria Tan’s draft')).toHaveCount(0);
    }
    function n(x: number) { return x === 1 ? '1 observation' : `${x} observations`; }
  });

  test('profiles never show a milestone without observations', async ({ page }) => {
    test.setTimeout(120_000);
    for (const id of IDS) {
      await page.goto(`./#/students/${id}`);
      const cards = page.locator('.domain-grid > article');
      await expect(cards).toHaveCount(4);
      for (let i = 0; i < 4; i++) {
        const text = (await cards.nth(i).textContent())!;
        const noObs = text.includes('No observations this term yet');
        expect(noObs, `${id} card ${i}`).toBe(text.includes('Not yet observed'));
      }
    }
  });

  test('report checks reflect real content; incomplete drafts cannot be submitted', async ({ page }) => {
    await page.goto('./#/students/sofia/report');
    const panel = page.getByRole('complementary', { name: 'Review' });
    await expect(panel.getByText('3 of 4 domains written')).toBeVisible();
    await expect(panel.getByText('Teacher reflection missing')).toBeVisible();
    const submit = panel.getByRole('button', { name: 'Submit for review' });
    await expect(submit).toHaveAttribute('aria-disabled', 'true');
    await submit.click({ force: true });
    await expect(panel.locator('.status').first()).toHaveText('Draft');

    // Changes requested: reviewer note and the way back to the Studio come first.
    await page.goto('./#/students/rayan/report');
    const rayan = page.getByRole('complementary', { name: 'Review' });
    await expect(rayan.locator('.notice').first()).toContainText('second observation');
    await expect(rayan.locator('.notice').first().getByRole('link', { name: 'Open AI Portfolio Studio' })).toBeVisible();
  });

  test('a not-started report starts from its own observations; the Studio explains a blocked submit', async ({ page }) => {
    await page.goto('./#/students/kai/studio');
    await expect(page.getByRole('button', { name: 'Submit for review' })).toHaveCount(0);
    await expect(page.getByText('Saved at')).toHaveCount(0);
    await expect(page.getByText(/Start the draft first/)).toBeVisible();
    await page.getByRole('button', { name: 'Start draft from observations' }).click();
    await expect(page.locator('.studio-head .status').first()).toHaveText('Draft');
    await expect(page.getByRole('region', { name: 'Narrative' }).locator('.src').first()).toBeVisible();
    await page.getByRole('button', { name: 'Submit for review' }).click({ force: true });
    const why = page.locator('#why-blocked');
    await expect(why).toContainText('Not ready for review');
    await expect(why).toContainText('Teacher reflection missing');
  });
});

test.describe('all students · mobile 390', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('student list status labels hug their text; report checks fold into one line', async ({ page }) => {
    await page.goto('./#/students');
    const st = page.locator('.row-link .status').first();
    const row = page.locator('.row-link').first();
    expect((await st.boundingBox())!.width).toBeLessThan((await row.boundingBox())!.width / 2);
    await page.goto('./#/students/aria/report');
    const toggle = page.getByRole('button', { name: /checks done/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(page.locator('#readiness-list')).toBeVisible();
  });
});
