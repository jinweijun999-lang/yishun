import { chromium } from "playwright";

const baseUrl = process.env.YISHUN_BASE_URL ?? "http://localhost:3000";

async function expectText(locator, expected, label) {
  await locator.waitFor({ state: "visible", timeout: 10_000 });
  const text = (await locator.textContent())?.trim() ?? "";
  if (!text.includes(expected)) {
    throw new Error(`${label}: expected text to include ${JSON.stringify(expected)}, got ${JSON.stringify(text)}`);
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.context().clearCookies();
  await page.reload({ waitUntil: "networkidle" });

  await expectText(page.locator("h2").first(), "What should you lean into today?", "initial English home title");

  await page.locator("select").first().selectOption("zh-CN");
  await expectText(page.locator("h2").first(), "今天适合顺势推进什么？", "en -> zh home title");
  await expectText(page.locator("body"), "开始免费今日信号", "en -> zh CTA");

  await page.reload({ waitUntil: "networkidle" });
  await expectText(page.locator("h2").first(), "今天适合顺势推进什么？", "zh persists after refresh");

  await page.locator("select").first().selectOption("en");
  await expectText(page.locator("h2").first(), "What should you lean into today?", "zh -> en home title");

  await page.reload({ waitUntil: "networkidle" });
  await expectText(page.locator("h2").first(), "What should you lean into today?", "en persists after refresh");

  console.log("i18n language switch smoke passed", { baseUrl });
} finally {
  await browser.close();
}
