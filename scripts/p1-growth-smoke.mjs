#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EVIDENCE = process.env.EVIDENCE_DIR || '/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-p1-growth-implementation-20260514';
fs.mkdirSync(EVIDENCE, { recursive: true });

const samplePreview = {
  birthProfile: { birthDate: '1990-05-20', birthTime: '08:30', birthTimeKnown: true, birthPlaceText: 'Shanghai, China', timezoneName: 'Asia/Shanghai', timezoneOffsetMinutes: -480 },
  trueSolarTime: { date: '1990-05-20', time: '08:24', offsetMinutes: -6, changedHourPillar: false, changedDayBoundary: false, precision: 'city' },
  fourPillars: { year: { pillar: 'Geng-Wu' }, month: { pillar: 'Xin-Si' }, day: { pillar: 'Yi-You' }, hour: { pillar: 'Geng-Chen' } },
  dayMaster: 'Yi Wood',
  elementsBalance: { wood: 28, fire: 18, earth: 16, metal: 24, water: 14 },
  dominantElement: 'Wood', missingElement: 'Water', favorableElement: 'Water',
  tenGodPattern: { label: 'Balanced action', plain: 'Use structure without rushing the decision.' },
  interpretation: { dayMasterDescription: 'Your chart is ready for practical timing guidance.', strengthAnalysis: 'Balanced enough for a measured push.', favorableElements: ['Water', 'Wood'] },
  dailySignal: { score: 84, bestFor: ['planning', 'focused outreach', 'calm decisions'], do: 'Choose one meaningful push and write the next step before you commit.', avoid: 'Do not force a final answer before the options are clear.', bestHour: '07:00–09:00', luckyElement: 'Water', luckyDirection: 'East', why: 'The current signal favors practical planning and one calm outreach.', deeperInsight: 'Use this as a reflection cue, not a fixed prediction.', disclaimer: 'For reflection only. Not financial, medical, legal, or psychological advice.' },
  focus: 'Work',
};

function shot(name) {
  return path.join(EVIDENCE, `${name}.png`);
}

async function bodyIncludes(page, text) {
  const body = await page.locator('body').innerText();
  if (!body.toLowerCase().includes(text.toLowerCase())) throw new Error(`Missing text: ${text}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 } });
const page = await context.newPage();
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'share', { value: async () => undefined, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => undefined }, configurable: true });
});
await page.route('**/api/v1/shares', async (route) => {
  await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ share_id: 'shr_sample_20260514', share_url: `${BASE}/s/shr_sample_20260514`, deep_link: 'yishun://share/shr_sample_20260514', expires_at: new Date(Date.now() + 86400000).toISOString() }) });
});

await page.goto('/samples', { waitUntil: 'networkidle' });
await bodyIncludes(page, '中文样例');
await bodyIncludes(page, 'English samples');
await page.screenshot({ path: shot('p1-samples'), fullPage: true });

for (const id of ['zh-founder-launch', 'zh-relationship-reset', 'en-career-pivot', 'en-money-boundary']) {
  await page.goto(`/samples/${id}`, { waitUntil: 'networkidle' });
  await bodyIncludes(page, id.startsWith('zh') ? '行动建议' : 'Action plan');
}

await page.goto('/s/shr_sample_20260514', { waitUntil: 'networkidle' });
await bodyIncludes(page, 'YiShun Timing Card');
await bodyIncludes(page, 'Generate my Yi Card');
await bodyIncludes(page, 'For reflection');
await page.screenshot({ path: shot('p1-share-page'), fullPage: true });

await page.goto('/reading/result', { waitUntil: 'domcontentloaded' });
await page.evaluate((preview) => {
  localStorage.setItem('yishun:p0Preview', JSON.stringify(preview));
}, samplePreview);
await page.reload({ waitUntil: 'networkidle' });
await bodyIncludes(page, 'Share today');
await bodyIncludes(page, 'View sample reports');
await page.getByRole('button', { name: /Share today|Copy or system-share/i }).first().click();
await page.waitForFunction(() => document.body.innerText.includes('Share link ready') || document.body.innerText.includes('Copied / shared'), null, { timeout: 10000 });
await page.screenshot({ path: shot('p1-result-share'), fullPage: true });

await page.goto('/reports', { waitUntil: 'networkidle' });
await bodyIncludes(page, 'Daily Ritual history');
await page.screenshot({ path: shot('p1-reports'), fullPage: true });

const events = await page.evaluate(() => JSON.parse(localStorage.getItem('yishun:p0AnalyticsQueue') || '[]'));
const eventNames = events.map((entry) => entry.event);
for (const expected of ['share_click', 'report_view']) {
  if (!eventNames.includes(expected)) throw new Error(`Missing analytics event ${expected}`);
}

const summary = { base: BASE, evidenceDir: EVIDENCE, eventNames, generatedAt: new Date().toISOString() };
fs.writeFileSync(path.join(EVIDENCE, 'p1-growth-smoke-summary.json'), JSON.stringify(summary, null, 2));
await browser.close();
console.log(`P1 growth smoke passed. Evidence: ${EVIDENCE}`);
