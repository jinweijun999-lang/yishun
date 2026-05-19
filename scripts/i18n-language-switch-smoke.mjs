import { chromium } from "playwright";

const baseUrl = process.env.YISHUN_BASE_URL ?? "http://localhost:3000";

async function expectText(locator, expected, label) {
  await locator.waitFor({ state: "visible", timeout: 10_000 });
  const text = (await locator.textContent())?.trim() ?? "";
  if (!text.includes(expected)) {
    throw new Error(`${label}: expected text to include ${JSON.stringify(expected)}, got ${JSON.stringify(text)}`);
  }
}

async function expectPageText(page, expected, label) {
  await expectText(page.locator("body"), expected, label);
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.context().clearCookies();
  await page.reload({ waitUntil: "networkidle" });

  await expectPageText(page, "Today’s Decision Brief", "initial English home stable copy");

  await page.getByLabel(/Language|语言/).selectOption("zh-CN");
  await expectPageText(page, "今日决策简报", "en -> zh home stable copy");
  await expectPageText(page, "开始免费今日信号", "en -> zh CTA");

  await page.reload({ waitUntil: "networkidle" });
  await expectPageText(page, "今日决策简报", "zh persists after refresh");

  await page.getByLabel(/Language|语言/).selectOption("en");
  await expectPageText(page, "Today’s Decision Brief", "zh -> en home stable copy");

  await page.reload({ waitUntil: "networkidle" });
  await expectPageText(page, "Today’s Decision Brief", "en persists after refresh");

  console.log("i18n language switch smoke passed", { baseUrl });
} finally {
  await browser.close();
}
