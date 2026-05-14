#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || "/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-v2-wrong-second-60-hotfix-20260514";

const edgeBirthProfile = {
  birthDate: "1990-01-01",
  birthTime: "17:08",
  birthTimeKnown: true,
  birthPlaceText: "Beijing, China",
  longitude: null,
  latitude: null,
  timezoneOffsetMinutes: -480,
  timezoneName: "Asia/Shanghai",
  gender: "female",
  locale: "zh",
  focus: "General",
  // This smoke isolates true-solar-time normalization. AI enrichment is covered by
  // gemini-hybrid-smoke and disabled here to avoid external-provider flakiness.
  enableAi: false,
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function assertNoWrongSecond(text, context) {
  if (/wrong second\s+60/i.test(text)) {
    throw new Error(`${context}: found wrong second 60`);
  }
}

async function assertApiEdgeCase(page) {
  const response = await page.request.post(`${BASE}/api/bazi/preview`, { data: edgeBirthProfile });
  const body = await response.text();
  assertNoWrongSecond(body, "api body");
  if (!response.ok()) {
    throw new Error(`API edge case failed: ${response.status()} ${body}`);
  }
  const data = JSON.parse(body);
  if (data.trueSolarTime?.time !== "17:05") {
    throw new Error(`Expected rounded true solar time 17:05, got ${data.trueSolarTime?.time ?? "<missing>"}`);
  }
  fs.writeFileSync(path.join(EVIDENCE_DIR, "wrong-second-60-api-response.json"), JSON.stringify(data, null, 2));
}

async function assertMobileZhOnboarding(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, baseURL: BASE });
  await context.addCookies([{ name: "locale", value: "zh-CN", url: BASE }]);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/reading/start", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "mobile-zh-step-1.png"), fullPage: true });

  const selects = page.locator("form select.input-field");
  await selects.nth(0).selectOption("1990");
  await selects.nth(1).selectOption("01");
  await selects.nth(2).selectOption("01");
  await selects.nth(3).selectOption("17");
  await selects.nth(4).selectOption("08");
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "继续" }).click();
  await page.waitForSelector('input[placeholder="城市，国家"], input[placeholder="City, country"]', { timeout: 10000 });

  const cityInput = page.locator('input[placeholder="城市，国家"], input[placeholder="City, country"]').first();
  await cityInput.fill("北京，中国");
  await page.getByRole("button", { name: "继续" }).click();

  await page.getByRole("button", { name: "综合" }).click();
  await page.locator("form select.input-field").last().selectOption("female");
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "mobile-zh-step-3-general-female.png"), fullPage: true });
  await page.getByRole("button", { name: "找到我的最佳时机" }).click();

  await page.waitForURL("**/reading/result", { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    () => !document.body.innerText.includes("wrong second 60") && !document.body.innerText.includes("正在加载你的信号"),
    null,
    { timeout: 10000 }
  );
  const text = await page.locator("body").innerText();
  assertNoWrongSecond(text, "mobile zh result");
  if (!text.includes("时机清晰度")) {
    throw new Error("Mobile zh result did not render the timing clarity screen");
  }
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "mobile-zh-result-success.png"), fullPage: true });

  if (consoleErrors.some((line) => /wrong second\s+60/i.test(line))) {
    throw new Error(`Console included wrong second 60: ${consoleErrors.join("\n")}`);
  }
  await context.close();
}

async function main() {
  ensureDir(EVIDENCE_DIR);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ baseURL: BASE });
    await assertApiEdgeCase(page);
    await page.close();
    await assertMobileZhOnboarding(browser);
  } finally {
    await browser.close();
  }
  const summary = {
    base: BASE,
    edgeBirthProfile,
    checks: ["api edge second=60 normalization", "mobile zh reading/start step 3 General/female submit"],
    evidenceDir: EVIDENCE_DIR,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(EVIDENCE_DIR, "wrong-second-60-smoke-summary.json"), JSON.stringify(summary, null, 2));
  console.log("PASS wrong-second-60-smoke");
  console.log(`Evidence: ${EVIDENCE_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
