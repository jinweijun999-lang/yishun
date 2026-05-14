#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || "/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-p0-product-ux-implementation-20260514";
const cases = [
  { locale: "en", label: "en-desktop", viewport: { width: 1440, height: 1100 } },
  { locale: "zh-CN", label: "zh-desktop", viewport: { width: 1440, height: 1100 } },
  { locale: "en", label: "en-mobile", viewport: { width: 390, height: 844 } },
  { locale: "zh-CN", label: "zh-mobile", viewport: { width: 390, height: 844 } },
];

const samplePreview = {
  birthProfile: {
    birthDate: "1990-05-20",
    birthTime: "08:30",
    birthTimeKnown: true,
    birthPlaceText: "Shanghai, China",
    timezoneName: "Asia/Shanghai",
    timezoneOffsetMinutes: -480,
  },
  trueSolarTime: {
    date: "1990-05-20",
    time: "08:24",
    offsetMinutes: -6,
    changedHourPillar: false,
    changedDayBoundary: false,
    precision: "city",
  },
  fourPillars: {
    year: { pillar: "Geng-Wu" },
    month: { pillar: "Xin-Si" },
    day: { pillar: "Yi-You" },
    hour: { pillar: "Geng-Chen" },
  },
  dayMaster: "Yi Wood",
  elementsBalance: { wood: 28, fire: 18, earth: 16, metal: 24, water: 14 },
  dominantElement: "Wood",
  missingElement: "Water",
  favorableElement: "Water",
  tenGodPattern: { label: "Balanced action", plain: "Use structure without rushing the decision." },
  interpretation: {
    dayMasterDescription: "Your chart is ready for practical timing guidance.",
    strengthAnalysis: "Balanced enough for a measured push.",
    favorableElements: ["Water", "Wood"],
  },
  dailySignal: {
    score: 84,
    bestFor: ["planning", "focused outreach", "calm decisions"],
    do: "Choose one meaningful push and write the next step before you commit.",
    avoid: "Do not force a final answer before the options are clear.",
    bestHour: "07:00–09:00",
    luckyElement: "Water",
    luckyDirection: "East",
    why: "The current signal favors practical planning and one calm outreach.",
    deeperInsight: "Use this as a reflection cue, not a fixed prediction.",
    disclaimer: "For reflection only. Not financial, medical, legal, or psychological advice.",
  },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
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

async function runCase(browser, testCase) {
  const context = await browser.newContext({ viewport: testCase.viewport, baseURL: BASE });
  await context.addCookies([{ name: "locale", value: testCase.locale, url: BASE }]);
  const page = await context.newPage();
  await page.route("**/api/bazi/preview", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(samplePreview) });
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await assertNoHorizontalScroll(page, `${testCase.label} home`);
  const homeText = await page.locator("body").innerText();
  if (testCase.locale === "zh-CN" && !homeText.includes("隐私边界")) throw new Error("ZH home trust/privacy copy missing");
  if (testCase.locale === "en" && !homeText.includes("Privacy boundary")) throw new Error("EN home trust/privacy copy missing");
  await page.screenshot({ path: path.join(EVIDENCE_DIR, `${testCase.label}-01-home.png`), fullPage: true });

  await page.getByRole("link", { name: testCase.locale === "zh-CN" ? /开始免费今日信号|生成我的信号/ : /Start my free daily signal|Create your signal/ }).first().click();
  await page.waitForURL("**/reading/start", { timeout: 10000 });
  await assertNoHorizontalScroll(page, `${testCase.label} start`);

  const selects = page.locator("form select.input-field");
  await selects.nth(0).selectOption("1990");
  await selects.nth(1).selectOption("05");
  await selects.nth(2).selectOption("20");
  await selects.nth(3).selectOption("08");
  await selects.nth(4).selectOption("30");
  await page.getByRole("button", { name: testCase.locale === "zh-CN" ? "继续" : "Continue" }).click();
  await page.getByPlaceholder(testCase.locale === "zh-CN" ? "城市，国家" : "City, country").fill("Shanghai, China");
  await page.getByRole("button", { name: testCase.locale === "zh-CN" ? "继续" : "Continue" }).click();
  await page.getByRole("button", { name: testCase.locale === "zh-CN" ? "找到我的最佳时机" : "Find my best timing" }).click();
  await page.waitForURL("**/reading/result", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !document.body.innerText.includes("Loading your signal") && !document.body.innerText.includes("正在加载你的信号"), null, { timeout: 10000 });
  await assertNoHorizontalScroll(page, `${testCase.label} result`);
  const resultText = await page.locator("body").innerText();
  const normalizedResultText = resultText.toLowerCase();
  if (testCase.locale === "zh-CN") {
    for (const expected of ["今日摘要", "3 条行动建议", "适合 / 避免", "仅供娱乐和自我反思"]) {
      if (!normalizedResultText.includes(expected.toLowerCase())) throw new Error(`ZH result missing: ${expected}`);
    }
  } else {
    for (const expected of ["One action", "3 practical actions", "Best for / avoid", "For reflection only"]) {
      if (!normalizedResultText.includes(expected.toLowerCase())) throw new Error(`EN result missing: ${expected}`);
    }
  }
  await page.screenshot({ path: path.join(EVIDENCE_DIR, `${testCase.label}-02-result.png`), fullPage: true });

  await page.goto("/reports", { waitUntil: "networkidle" });
  await assertNoHorizontalScroll(page, `${testCase.label} reports`);
  const reportsText = (await page.locator("body").innerText()).toLowerCase();
  if (testCase.locale === "zh-CN" && !reportsText.includes("报告价值结构")) throw new Error("ZH reports value structure missing");
  if (testCase.locale === "en" && !reportsText.includes("report value structure")) throw new Error("EN reports value structure missing");
  await page.screenshot({ path: path.join(EVIDENCE_DIR, `${testCase.label}-03-reports.png`), fullPage: true });

  await context.close();
  return testCase.label;
}

async function main() {
  ensureDir(EVIDENCE_DIR);
  const browser = await chromium.launch({ headless: true });
  const passed = [];
  try {
    for (const testCase of cases) {
      const label = await runCase(browser, testCase);
      passed.push(label);
      console.log(`✓ ${label}`);
    }
  } finally {
    await browser.close();
  }
  const summaryPath = path.join(EVIDENCE_DIR, "p0-new-user-smoke-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify({ base: BASE, passed, evidenceDir: EVIDENCE_DIR, generatedAt: new Date().toISOString() }, null, 2));
  console.log(`PASS p0-new-user-smoke (${passed.length}/${cases.length})`);
  console.log(`Evidence: ${EVIDENCE_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
