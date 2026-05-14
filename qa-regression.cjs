#!/usr/bin/env node
/**
 * YiShun QA Regression Gate — current product UX paths.
 *
 * Scope intentionally avoids production payments/live external services. Network calls that
 * would depend on auth backends or AI generation are mocked at the browser boundary so this
 * remains a deterministic local regression gate for UX structure and routing.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EVIDENCE = process.env.EVIDENCE_DIR || '/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-qa-regression-gate-fix-20260514';
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1440, height: 1100 };
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

let passed = 0;
let failed = 0;
const failures = [];

const samplePreview = {
  birthProfile: {
    birthDate: '1990-05-20',
    birthTime: '08:30',
    birthTimeKnown: true,
    birthPlaceText: 'Shanghai, China',
    timezoneName: 'Asia/Shanghai',
    timezoneOffsetMinutes: -480,
  },
  trueSolarTime: {
    date: '1990-05-20',
    time: '08:24',
    offsetMinutes: -6,
    changedHourPillar: false,
    changedDayBoundary: false,
    precision: 'city',
  },
  fourPillars: {
    year: { pillar: 'Geng-Wu' },
    month: { pillar: 'Xin-Si' },
    day: { pillar: 'Yi-You' },
    hour: { pillar: 'Geng-Chen' },
  },
  dayMaster: 'Yi Wood',
  elementsBalance: { wood: 28, fire: 18, earth: 16, metal: 24, water: 14 },
  dominantElement: 'Wood',
  missingElement: 'Water',
  favorableElement: 'Water',
  tenGodPattern: { label: 'Balanced action', plain: 'Use structure without rushing the decision.' },
  interpretation: {
    dayMasterDescription: 'Your chart is ready for practical timing guidance.',
    strengthAnalysis: 'Balanced enough for a measured push.',
    favorableElements: ['Water', 'Wood'],
  },
  dailySignal: {
    score: 84,
    bestFor: ['planning', 'focused outreach', 'calm decisions'],
    do: 'Choose one meaningful push and write the next step before you commit.',
    avoid: 'Do not force a final answer before the options are clear.',
    bestHour: '07:00–09:00',
    luckyElement: 'Water',
    luckyDirection: 'East',
    why: 'The current signal favors practical planning and one calm outreach.',
    deeperInsight: 'Use this as a reflection cue, not a fixed prediction.',
    disclaimer: 'For reflection only. Not financial, medical, legal, or psychological advice.',
  },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function evidencePath(name) {
  return path.join(EVIDENCE, `${name}_${TIMESTAMP}.png`);
}

async function withCase(label, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${label}`);
  } catch (error) {
    failed += 1;
    failures.push({ label, error: error.message });
    console.log(`  ✗ ${label}: ${error.message}`);
  }
}

async function assertNoHorizontalScroll(page, label) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  const maxScrollWidth = Math.max(metrics.scrollWidth, metrics.bodyScrollWidth);
  if (maxScrollWidth > metrics.innerWidth + 1) {
    throw new Error(`${label} horizontal overflow: viewport=${metrics.innerWidth}, scrollWidth=${maxScrollWidth}`);
  }
}

async function selectLocale(page, locale) {
  const langSelect = page.locator('select[aria-label], label select').first();
  if (!(await langSelect.count())) throw new Error('Language select not found');
  await langSelect.selectOption(locale);
  await page.waitForTimeout(300);
}

async function expectBodyIncludes(page, expected, label) {
  const text = await page.locator('body').innerText();
  if (!text.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`${label} missing text: ${expected}`);
  }
}

async function installDeterministicRoutes(page) {
  await page.route('**/api/bazi/preview', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(samplePreview) });
  });
  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'set-cookie': 'fortune_session=qa-regression; Path=/; SameSite=Lax' },
      body: JSON.stringify({ user: { email: 'qa-regression@example.com', birthDate: '1990-05-20', birthTime: '08:30', gender: 'other' } }),
    });
  });
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'set-cookie': 'fortune_session=qa-regression; Path=/; SameSite=Lax' },
      body: JSON.stringify({ user: { email: 'qa-regression@example.com', birthDate: '1990-05-20', birthTime: '08:30', gender: 'other' } }),
    });
  });
  await page.route('**/api/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ profile: { email: 'qa-regression@example.com', birthDate: '1990-05-20', birthTime: '08:30', gender: 'other', planTier: 'free', consultationCredits: 0 } }),
    });
  });
  await page.route('**/api/consultations', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ consultations: [] }) });
  });
  await page.route('**/api/v1/shares', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ share_id: 'shr_sample_20260514', share_url: `${BASE}/s/shr_sample_20260514`, deep_link: 'yishun://share/shr_sample_20260514', expires_at: new Date(Date.now() + 86400000).toISOString() }),
    });
  });
}

async function fillBirthDateTimeSelects(page, baseIndex = 0) {
  const selects = page.locator('select.input-field');
  await selects.nth(baseIndex + 0).selectOption('1990');
  await selects.nth(baseIndex + 1).selectOption('05');
  await selects.nth(baseIndex + 2).selectOption('20');
  await selects.nth(baseIndex + 3).selectOption('08');
  await selects.nth(baseIndex + 4).selectOption('30');
}

async function completeReadingFlow(page, locale) {
  await page.goto('/reading/start', { waitUntil: 'networkidle' });
  await assertNoHorizontalScroll(page, `${locale} reading start`);
  await fillBirthDateTimeSelects(page, 0);
  await page.getByRole('button', { name: locale === 'zh-CN' ? '继续' : 'Continue' }).click();
  await page.getByPlaceholder(locale === 'zh-CN' ? '城市，国家' : 'City, country').fill('Shanghai, China');
  await page.getByRole('button', { name: locale === 'zh-CN' ? '继续' : 'Continue' }).click();
  await page.getByRole('button', { name: locale === 'zh-CN' ? '找到我的最佳时机' : 'Find my best timing' }).click();
  await page.waitForURL('**/reading/result', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => !document.body.innerText.includes('Loading your signal') && !document.body.innerText.includes('正在加载你的信号'), null, { timeout: 10000 });
  await assertNoHorizontalScroll(page, `${locale} reading result`);
}

async function main() {
  ensureDir(EVIDENCE);
  console.log('🚀 Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT, baseURL: BASE });
  const page = await context.newPage();
  await installDeterministicRoutes(page);

  console.log('\n========== QA REGRESSION START ==========' );

  console.log('\n[1] Language Switching');
  await withCase('Language select switches EN↔ZH, persists through navigation and reload', async () => {
    await context.clearCookies();
    await page.goto('/', { waitUntil: 'networkidle' });
    await selectLocale(page, 'zh-CN');
    await expectBodyIncludes(page, '隐私边界', 'ZH home');
    await page.screenshot({ path: evidencePath('1a-home-zh'), fullPage: true });
    await page.goto('/tools', { waitUntil: 'networkidle' });
    await expectBodyIncludes(page, '工具', 'ZH tools');
    await page.reload({ waitUntil: 'networkidle' });
    await expectBodyIncludes(page, '工具', 'ZH tools reload');
    await selectLocale(page, 'en');
    await page.goto('/', { waitUntil: 'networkidle' });
    await expectBodyIncludes(page, 'Privacy boundary', 'EN home copy after switch context');
  });

  console.log('\n[2] Homepage CTA');
  await withCase('Homepage primary CTA reaches current reading start path', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await selectLocale(page, 'en');
    await page.getByRole('link', { name: /Start my free daily signal|Create your signal/ }).first().click();
    await page.waitForURL('**/reading/start', { timeout: 10000 });
    await expectBodyIncludes(page, '60 seconds', 'reading start');
    await page.screenshot({ path: evidencePath('2-reading-start'), fullPage: true });
  });

  console.log('\n[3] Registration/Login current forms');
  await withCase('Register form uses current select-based birth/time fields and submits', async () => {
    await context.clearCookies();
    await page.goto('/register?returnTo=/profile', { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill(`qa-${Date.now()}@example.com`);
    await page.locator('input[type="password"]').fill('Test123456!');
    await fillBirthDateTimeSelects(page, 0);
    await page.locator('select.input-field').nth(5).selectOption('other');
    await page.screenshot({ path: evidencePath('3a-register-filled'), fullPage: true });
    await page.getByRole('button', { name: /Create account|创建账户|创建账号/i }).click();
    await page.waitForURL('**/profile', { timeout: 10000 });
  });

  await withCase('Login form submits via current placeholders/buttons', async () => {
    await page.goto('/login?returnTo=/profile', { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill('qa-regression@example.com');
    await page.locator('input[type="password"]').fill('Test123456!');
    await page.getByRole('button', { name: /Sign in|登录|登入/i }).click();
    await page.waitForURL('**/profile', { timeout: 10000 });
    await page.screenshot({ path: evidencePath('3b-login-profile'), fullPage: true });
  });

  console.log('\n[4] Reading Start/Result');
  await withCase('EN reading start → result renders P0 report structure', async () => {
    await selectLocale(page, 'en');
    await completeReadingFlow(page, 'en');
    for (const expected of ['One action', '3 practical actions', 'Best for / avoid', 'For reflection only', 'View sample reports']) {
      await expectBodyIncludes(page, expected, 'EN result');
    }
    await page.screenshot({ path: evidencePath('4a-result-en'), fullPage: true });
  });

  await withCase('ZH reading start → result renders P0 report structure', async () => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await selectLocale(page, 'zh-CN');
    await completeReadingFlow(page, 'zh-CN');
    for (const expected of ['今日摘要', '3 条行动建议', '适合 / 避免', '仅供娱乐和自我反思']) {
      await expectBodyIncludes(page, expected, 'ZH result');
    }
    await page.screenshot({ path: evidencePath('4b-result-zh'), fullPage: true });
  });

  console.log('\n[5] Reports');
  await withCase('Reports page renders current P0 report value structure and saved ritual state', async () => {
    await page.goto('/reports', { waitUntil: 'networkidle' });
    await assertNoHorizontalScroll(page, 'reports');
    await expectBodyIncludes(page, '报告价值结构', 'ZH reports');
    await expectBodyIncludes(page, '每日仪式历史', 'ZH reports history');
    await page.screenshot({ path: evidencePath('5-reports'), fullPage: true });
  });

  console.log('\n[6] Public/read-only pages');
  for (const routePath of ['/tools', '/learn', '/terms', '/privacy', '/membership', '/samples', '/samples/en-career-pivot', '/s/shr_sample_20260514']) {
    await withCase(`Public/read-only page loads: ${routePath}`, async () => {
      await page.goto(routePath, { waitUntil: 'networkidle' });
      await assertNoHorizontalScroll(page, routePath);
      const body = await page.locator('body').innerText();
      if (body.trim().length < 20) throw new Error(`${routePath} body unexpectedly empty`);
      await page.screenshot({ path: evidencePath(`6-${routePath.replace(/\//g, '') || 'home'}`), fullPage: true });
    });
  }

  console.log('\n[7] Mobile layout');
  await withCase('Mobile home/start/result/reports have no horizontal overflow', async () => {
    const mobileContext = await browser.newContext({ viewport: MOBILE_VIEWPORT, baseURL: BASE });
    const mobilePage = await mobileContext.newPage();
    await installDeterministicRoutes(mobilePage);
    await mobilePage.goto('/', { waitUntil: 'networkidle' });
    await assertNoHorizontalScroll(mobilePage, 'mobile home');
    await mobilePage.screenshot({ path: evidencePath('7a-mobile-home'), fullPage: true });
    await completeReadingFlow(mobilePage, 'en');
    await assertNoHorizontalScroll(mobilePage, 'mobile result');
    await mobilePage.goto('/reports', { waitUntil: 'networkidle' });
    await assertNoHorizontalScroll(mobilePage, 'mobile reports');
    await mobilePage.screenshot({ path: evidencePath('7b-mobile-reports'), fullPage: true });
    await mobileContext.close();
  });

  await browser.close();

  const summary = { base: BASE, passed, failed, failures, evidenceDir: EVIDENCE, generatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(EVIDENCE, 'qa-regression-summary.json'), JSON.stringify(summary, null, 2));

  console.log('\n========== QA REGRESSION COMPLETE ==========' );
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log(`Evidence: ${EVIDENCE}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((item) => console.log(`  ✗ ${item.label}: ${item.error}`));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
