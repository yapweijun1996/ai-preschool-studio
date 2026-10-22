import { expect, test } from '@playwright/test';

const routes = ['#/', '#/students', '#/students/aria/report', '#/catalog'];

test('production routes make requests only to their own origin', async ({ page }) => {
  for (const route of routes) {
    const urls: string[] = [];
    const onRequest = (request: { url(): string }) => urls.push(request.url());
    page.on('request', onRequest);
    await page.goto(`./${route}`);
    await page.locator('#root').waitFor();
    const origin = new URL(page.url()).origin;
    page.off('request', onRequest);

    const thirdParty = urls.filter((value) => {
      if (value.startsWith('data:') || value.startsWith('blob:')) return false;
      try {
        return new URL(value).origin !== origin;
      } catch {
        return true;
      }
    });
    expect(thirdParty, `${route} requested resources outside ${origin}`).toEqual([]);
  }
});
