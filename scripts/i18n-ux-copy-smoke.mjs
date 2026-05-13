import { chromium } from "playwright";

const baseUrl = process.env.YISHUN_BASE_URL ?? "http://localhost:3000";

const cases = [
  {
    path: "/register",
    zhExpected: ["出生日期", "出生时间", "年", "月", "日", "时", "分"],
    zhForbidden: ["Year", "Month", "Day", "Hour", "Minute"],
    enExpected: ["Birth Date", "Birth Time", "Year", "Month", "Day", "Hour", "Minute"],
  },
  {
    path: "/reading/start",
    zhExpected: ["出生日期", "出生时间", "年", "月", "日", "时", "分"],
    zhForbidden: ["Year", "Month", "Day", "Hour", "Minute"],
    enExpected: ["Year", "Month", "Day", "Hour", "Minute"],
  },
  {
    path: "/reports",
    zhExpected: ["每日仪式报告", "回访提醒", "连续天数", "每日仪式历史", "本设备暂无每日仪式历史"],
    zhForbidden: ["Daily Ritual Reports", "RETURN HOOK", "DAY STREAK", "DAILY RITUAL HISTORY", "Come back tomorrow"],
    enExpected: ["Daily Ritual Reports", "Return hook", "day streak", "Daily Ritual history"],
  },
  {
    path: "/tools/sample",
    zhExpected: ["示例解读", "资料", "四柱", "五行", "十神结构"],
    zhForbidden: ["Sample reading", "Profile", "Four Pillars", "Five Elements", "Ten Gods pattern", "Go back"],
    enExpected: ["Sample reading", "Profile", "Four Pillars", "Five Elements", "Ten Gods pattern"],
    backAria: { zh: "返回", en: "Go back" },
  },
  {
    path: "/membership",
    zhExpected: ["会员", "免费会员", "月度会员", "年度会员", "单次咨询", "登录后再结账"],
    zhForbidden: ["Free Member", "Monthly Member", "Annual Member", "SINGLE CONSULTATION", "Unlock deeper Daily Ritual guidance"],
    enExpected: ["Membership", "Free Member", "Monthly Member", "Annual Member", "Single Consultation"],
  },
];

async function setLocale(context, locale) {
  await context.clearCookies();
  await context.addCookies([{ name: "locale", value: locale, url: baseUrl, sameSite: "Lax" }]);
}

async function pageText(page) {
  return ((await page.locator("body").textContent()) ?? "").replace(/\s+/g, " ").trim();
}

function assertIncludes(text, needles, label) {
  for (const needle of needles) {
    if (!text.includes(needle)) {
      throw new Error(`${label}: expected rendered text to include ${JSON.stringify(needle)}. Text: ${text.slice(0, 500)}`);
    }
  }
}

function assertExcludes(text, needles, label) {
  for (const needle of needles) {
    if (text.includes(needle)) {
      throw new Error(`${label}: rendered text must not include ${JSON.stringify(needle)}. Text: ${text.slice(0, 500)}`);
    }
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();

  for (const item of cases) {
    await setLocale(context, "zh-CN");
    await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
    const zhText = await pageText(page);
    assertIncludes(zhText, item.zhExpected, `${item.path} zh-CN`);
    assertExcludes(zhText, item.zhForbidden, `${item.path} zh-CN`);
    if (item.backAria) {
      const aria = await page.locator("button").first().getAttribute("aria-label");
      if (aria !== item.backAria.zh) {
        throw new Error(`${item.path} zh-CN: expected back button aria-label ${JSON.stringify(item.backAria.zh)}, got ${JSON.stringify(aria)}`);
      }
    }

    await setLocale(context, "en");
    await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
    const enText = await pageText(page);
    assertIncludes(enText, item.enExpected, `${item.path} en`);
    if (item.backAria) {
      const aria = await page.locator("button").first().getAttribute("aria-label");
      if (aria !== item.backAria.en) {
        throw new Error(`${item.path} en: expected back button aria-label ${JSON.stringify(item.backAria.en)}, got ${JSON.stringify(aria)}`);
      }
    }
  }

  console.log("i18n UX copy smoke passed", { baseUrl, pages: cases.map((item) => item.path) });
} finally {
  await browser.close();
}
