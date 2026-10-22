import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  { name: 'dashboard', path: './#/' },
  { name: 'admin-planned', path: './#/', role: 'admin' },
  { name: 'parent-planned', path: './#/', role: 'parent' },
  { name: 'catalog', path: './#/catalog' },
  { name: 'students', path: './#/students' },
  { name: 'coverage', path: './#/coverage', role: 'reviewer' },
  { name: 'reviews', path: './#/reviews', role: 'reviewer' },
  { name: 'aria-profile', path: './#/students/aria' },
  { name: 'aria-observe', path: './#/students/aria/observe' },
  { name: 'aria-progress', path: './#/students/aria/progress' },
  { name: 'aria-studio', path: './#/students/aria/studio' },
  { name: 'aria-report', path: './#/students/aria/report' },
  { name: 'family-report-released', path: './#/students/meiling/report/family', role: 'reviewer' },
  { name: 'family-report-empty', path: './#/students/hana/report/family', role: 'teacher' },
  { name: 'audit-reviewer', path: './#/audit', role: 'reviewer' },
  { name: 'audit-admin', path: './#/audit', role: 'admin' },
  { name: 'audit-parent-denied', path: './#/audit', role: 'parent' },
  { name: 'kai-studio', path: './#/students/kai/studio' },
  { name: 'settings-appearance', path: './#/settings/appearance' },
  { name: 'settings-framework', path: './#/settings/framework' },
  { name: 'settings-about', path: './#/settings/about' }
] as const;

const variants = [
  { name: 'desktop-light-en', width: 1440, height: 900, theme: 'light', language: 'en' },
  { name: 'desktop-dark-en', width: 1440, height: 900, theme: 'dark', language: 'en' },
  { name: 'mobile-light-en', width: 390, height: 844, theme: 'light', language: 'en' },
  { name: 'mobile-dark-en', width: 390, height: 844, theme: 'dark', language: 'en' },
  { name: 'desktop-light-zh', width: 1440, height: 900, theme: 'light', language: 'zh' }
] as const;

for (const route of routes) {
  for (const variant of variants) {
    test(`${route.name} · ${variant.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: variant.width, height: variant.height });
      await page.addInitScript(({ theme, language, role }) => {
        localStorage.setItem('aps-theme', theme);
        if (language === 'zh') localStorage.setItem('aps-lang', 'zh');
        if (role) sessionStorage.setItem('aps-demo-role', role);
      }, { theme: variant.theme, language: variant.language, role: 'role' in route ? route.role : undefined });
      await page.goto(route.path);
      await expect(page.getByRole('main')).toBeVisible();
      await page.waitForTimeout(600);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const summary = {
        route: route.path,
        variant: variant.name,
        url: page.url(),
        incompleteChecks: results.incomplete
          .filter(({ id }) => id === 'aria-prohibited-attr')
          .map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
        violations: results.violations.map(({ id, impact, description, help, nodes }) => ({
          id,
          impact,
          description,
          help,
          nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary }))
        }))
      };
      const filename = `${route.name}-${variant.name}.json`;
      await testInfo.attach(filename, {
        body: Buffer.from(JSON.stringify(summary, null, 2)),
        contentType: 'application/json'
      });
      const outputPath = resolve('test-results/a11y', filename);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, JSON.stringify(summary, null, 2));
      const blocking = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
      expect(blocking, `${blocking.length} serious/critical accessibility violations; see ${filename}`).toEqual([]);
      if (route.name === 'coverage') {
        expect(summary.incompleteChecks, `aria-prohibited-attr incomplete checks; see ${filename}`).toEqual([]);
      }
    });
  }
}
