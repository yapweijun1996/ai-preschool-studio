import { expect, test, type Page } from '@playwright/test';

const shot = (name: string) => ({ path: `test-results/screens/${name}.png`, fullPage: true });

type Lang = 'zh' | 'ms';

const COPY: Record<Lang, {
  greeting: string;
  addObservation: string;
  myStudents: string;
  learningProgress: string;
  unpin: string;
  studio: string;
  aiTab: string;
  apply: string;
  reject: string;
  regenerate: string;
  submit: string;
  reportTitle: string;
  blocked: string;
  approve: string;
  requestChanges: string;
  changeNote: string;
}> = {
  zh: {
    greeting: '早上好，Ms. Lim',
    addObservation: '添加观察记录',
    myStudents: '我的学生',
    learningProgress: '学习进展',
    unpin: '从侧边栏取消固定',
    studio: 'AI 学习档案工作室',
    aiTab: 'AI',
    apply: '应用',
    reject: '拒绝',
    regenerate: '重新生成',
    submit: '提交审核',
    reportTitle: '报告预览',
    blocked: '无法批准',
    approve: '批准',
    requestChanges: '要求修改',
    changeNote: '请核对“英语 English Language”中关于阅读的描述——我找不到相应的观察记录。'
  },
  ms: {
    greeting: 'Selamat pagi, Ms. Lim',
    addObservation: 'Tambah pemerhatian',
    myStudents: 'Murid Saya',
    learningProgress: 'Kemajuan pembelajaran',
    unpin: 'Nyahsemat daripada bar sisi',
    studio: 'Studio Portfolio AI',
    aiTab: 'AI',
    apply: 'Terapkan',
    reject: 'Tolak',
    regenerate: 'Jana semula',
    submit: 'Hantar untuk semakan',
    reportTitle: 'Pratonton laporan',
    blocked: 'Kelulusan disekat',
    approve: 'Luluskan',
    requestChanges: 'Minta perubahan',
    changeNote: 'Sila semak dakwaan membaca dalam Bahasa Inggeris 英语 — saya tidak nampak pemerhatian untuknya.'
  }
};

// English UI phrases that must not appear inside <main> once the page is translated.
const ENGLISH_UI = ['Add observation', 'Submit for review', 'Approval blocked', 'Learning progress'];

async function expectNoEnglishUi(page: Page) {
  const main = page.getByRole('main');
  for (const phrase of ENGLISH_UI) await expect(main).not.toContainText(phrase);
}

const VIEWPORTS = [
  { name: '1440', viewport: { width: 1440, height: 900 }, mobile: false },
  { name: '390', viewport: { width: 390, height: 844 }, mobile: true }
];

for (const lang of ['zh', 'ms'] as Lang[]) {
  const c = COPY[lang];
  for (const vp of VIEWPORTS) {
    test.describe(`pages in ${lang} · ${vp.name}`, () => {
      test.use({ viewport: vp.viewport, hasTouch: vp.mobile });
      test.beforeEach(async ({ page }) => {
        await page.addInitScript((l) => localStorage.setItem('aps-lang', l), lang);
      });

      test('dashboard, students and profile are translated', async ({ page }) => {
        await page.goto('./');
        await expect(page.getByRole('heading', { name: c.greeting })).toBeVisible();
        await expect(page.getByRole('link', { name: c.addObservation }).first()).toBeVisible();
        if (lang === 'zh') await expectNoEnglishUi(page);

        await page.goto('./#/students');
        await expect(page.getByRole('heading', { name: c.myStudents })).toBeVisible();
        await expect(page.getByRole('main').getByRole('link', { name: /Aria Tan/ })).toBeVisible();
        await page.screenshot(shot(`i18n-${lang}-${vp.name}-students`));

        await page.goto('./#/students/aria');
        await expect(page.getByRole('main').getByRole('link', { name: c.learningProgress, exact: true })).toBeVisible();
        // Aria Tan is pinned by default, so the toggle offers to unpin.
        await expect(page.getByRole('button', { name: c.unpin })).toBeVisible();
        if (lang === 'zh') await expectNoEnglishUi(page);
      });

      test('studio actions and approval-blocked report are translated', async ({ page }) => {
        await page.goto('./#/students/aria/studio');
        if (vp.mobile) await page.getByRole('tab', { name: c.aiTab, exact: true }).click();
        else await expect(page.getByRole('heading', { name: c.studio })).toBeVisible();
        await expect(page.getByRole('button', { name: c.apply, exact: true })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('button', { name: c.reject, exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: c.regenerate, exact: true })).toBeVisible();
        if (lang === 'zh') await expectNoEnglishUi(page);
        await page.screenshot(shot(`i18n-${lang}-${vp.name}-studio`));

        await page.getByRole('button', { name: c.submit }).click();
        await expect(page.getByRole('heading', { name: c.reportTitle })).toBeVisible();
        await expect(page.getByText(c.blocked, { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: c.approve, exact: true })).toHaveAttribute('aria-disabled', 'true');
        if (lang === 'zh') await expectNoEnglishUi(page);
        await page.screenshot(shot(`i18n-${lang}-${vp.name}-report`));

        // The prefilled request-changes note is in the current language too.
        if (!vp.mobile) {
          await page.getByRole('button', { name: c.requestChanges, exact: true }).click();
          await expect(page.locator('#change-note')).toHaveValue(c.changeNote);
        }
      });
    });
  }
}
