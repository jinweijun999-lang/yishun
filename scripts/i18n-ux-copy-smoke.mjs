import { chromium } from "playwright";

const baseUrl = process.env.YISHUN_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:3000";

const previewRequest = {
  birthDate: "1996-08-08",
  birthTime: "14:28",
  birthTimeKnown: true,
  birthPlaceText: "Beijing, China",
  longitude: 116.4,
  latitude: 39.9,
  timezoneName: "Asia/Shanghai",
  timezoneOffsetMinutes: -480,
  gender: "other",
  locale: "zh-CN",
};

const cases = [
  {
    path: "/",
    zhExpected: ["先看完整命运报告", "问 AI 大师", "测我和 TA", "今日抽一签", "免费开始", "开始免费命运预览", "产品亮点", "准确性如何处理"],
    zhForbidden: ["Unlock your full destiny report", "Check me and TA", "Draw today’s sign", "Start free", "Best for", "Element", "Direction"],
    enExpected: ["Unlock your full destiny report", "Ask AI Master", "Check me and TA", "Draw today’s sign", "Start free", "Start my free destiny preview"],
  },
  {
    path: "/reading/result",
    seedPreview: true,
    zhExpected: ["完整东方命运报告预览", "完整报告未解锁", "今日状态解读", "最佳窗口", "避开", "一项行动", "已锁定模块", "五行", "十神"],
    zhForbidden: ["Full Eastern Destiny Report Preview", "Full report locked", "Today’s emotional read", "Best window", "Avoid", "One action", "five elements", "ten gods"],
    enExpected: ["Full Eastern Destiny Report Preview", "Full report locked", "Today’s emotional read", "Best window", "Avoid", "One action"],
  },
  {
    path: "/register",
    zhExpected: ["出生日期", "出生时间", "年", "月", "日", "时", "分"],
    zhForbidden: ["Year", "Month", "Day", "Hour", "Minute"],
    enExpected: ["Birth Date", "Birth Time", "Year", "Month", "Day", "Hour", "Minute"],
  },
  {
    path: "/reading/start",
    zhExpected: ["完整命运报告入口", "60 秒生成你的免费命运预览", "出生日期", "出生时间", "年", "月", "日", "时", "分"],
    zhForbidden: ["Full destiny report entry", "Generate your free destiny preview", "Year", "Month", "Day", "Hour", "Minute", "Finding today", "Checking your", "Turning it"],
    enExpected: ["Full destiny report entry", "Generate your free destiny preview", "Year", "Month", "Day", "Hour", "Minute"],
  },
  {
    path: "/reports",
    seedHistory: true,
    zhExpected: ["个人节奏中心", "回访提醒", "连续天数", "每日仪式历史", "综合", "复核细节", "借用土的能量"],
    zhForbidden: ["Daily Ritual Reports", "RETURN HOOK", "DAY STREAK", "DAILY RITUAL HISTORY", "Come back tomorrow", "General", "reviewing details", "Borrow Earth energy", "saying yes to vague plans"],
    enExpected: ["Personal rhythm center", "Return hook", "day streak", "Daily Ritual history"],
  },
  {
    path: "/tools/sample",
    zhExpected: ["示例解读", "资料", "四柱", "五行", "十神结构"],
    zhForbidden: ["Sample reading", "Profile", "Four Pillars", "Five Elements", "Ten Gods pattern", "Go back"],
    enExpected: ["Sample reading", "Profile", "Four Pillars", "Five Elements", "Ten Gods pattern"],
    backAria: { zh: "返回", en: "Go back" },
  },
  {
    path: "/s/not-a-real-share-id",
    zhExpected: ["已分享的洞察", "朋友分享了一条易顺时机洞察", "生成你自己的时机卡", "易顺时机卡", "每日", "生成我的易顺卡", "隐私", "条款"],
    zhForbidden: ["Shared insight", "A friend shared", "Create your own timing card", "YiShun Timing Card", "Element cue", "Generate my Yi Card", "Open in app", "Privacy", "Terms"],
    enExpected: ["Shared insight", "A friend shared", "Create your own timing card", "YiShun Timing Card"],
  },
  {
    path: "/membership",
    zhExpected: ["会员", "免费会员", "月度会员", "年度会员", "单次咨询", "登录后购买"],
    zhForbidden: ["Free Member", "Monthly Member", "Annual Member", "SINGLE CONSULTATION", "Unlock deeper Daily Ritual guidance"],
    enExpected: ["Membership", "Free Member", "Monthly Member", "Annual Member", "Single Consultation"],
  },
];

async function setLocale(context, locale) {
  await context.clearCookies();
  await context.addCookies([{ name: "locale", value: locale, url: baseUrl, sameSite: "Lax" }]);
}

async function clearOriginStorage(page) {
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

async function seedHistory(page) {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.localStorage.setItem("yishun:dailyRitual:history", JSON.stringify([
      {
        date: new Date().toISOString().slice(0, 10),
        score: 76,
        bestFor: ["reviewing details", "budgeting"],
        focus: "General",
        savedAt: new Date().toISOString(),
        bestHour: "13:00–15:00",
        action: "Borrow Earth energy: choose the stable option and confirm the details.",
        avoid: "saying yes to vague plans without confirming the ground rules",
      },
    ]));
  });
}

async function seedReadingPreview(page, locale) {
  const response = await page.request.post(`${baseUrl}/api/bazi/preview`, {
    data: { ...previewRequest, locale },
  });
  if (!response.ok()) {
    throw new Error(`preview API failed: ${response.status()} ${await response.text()}`);
  }
  const preview = await response.json();
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.evaluate((value) => {
    window.localStorage.setItem("yishun:p0Preview", JSON.stringify(value));
    window.localStorage.setItem("yishun:dailyRitual:completedDate", new Date().toISOString().slice(0, 10));
  }, preview);
}

async function pageText(page) {
  await page.locator("body").waitFor({ state: "attached", timeout: 10_000 });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  return ((await page.locator("body").innerText()) ?? "").replace(/\s+/g, " ").trim();
}

function assertIncludes(text, needles, label) {
  const normalizedText = text.toLowerCase();
  for (const needle of needles) {
    if (!normalizedText.includes(needle.toLowerCase())) {
      throw new Error(`${label}: expected rendered text to include ${JSON.stringify(needle)}. Text: ${text.slice(0, 800)}`);
    }
  }
}

function assertExcludes(text, needles, label) {
  const normalizedText = text.toLowerCase();
  for (const needle of needles) {
    if (normalizedText.includes(needle.toLowerCase())) {
      throw new Error(`${label}: rendered text must not include ${JSON.stringify(needle)}. Text: ${text.slice(0, 800)}`);
    }
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();

  for (const item of cases) {
    await setLocale(context, "zh-CN");
    await clearOriginStorage(page);
    if (item.seedPreview) await seedReadingPreview(page, "zh-CN");
    if (item.seedHistory) await seedHistory(page);
    await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
    if (item.seedHistory) {
      await page.waitForFunction(() => document.body.innerText.includes("最佳窗口"), undefined, { timeout: 10_000 });
    }
    const zhText = await pageText(page);
    assertIncludes(zhText, item.zhExpected, `${item.path} zh-CN`);
    assertExcludes(zhText, item.zhForbidden, `${item.path} zh-CN`);
    if (item.backAria) {
      const backControl = page.getByLabel(item.backAria.zh).first();
      const aria = await backControl.getAttribute("aria-label");
      if (aria !== item.backAria.zh) {
        throw new Error(`${item.path} zh-CN: expected back control aria-label ${JSON.stringify(item.backAria.zh)}, got ${JSON.stringify(aria)}`);
      }
    }

    await setLocale(context, "en");
    await clearOriginStorage(page);
    if (item.seedPreview) await seedReadingPreview(page, "en");
    if (item.seedHistory) await seedHistory(page);
    await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
    if (item.seedHistory) {
      await page.waitForFunction(() => document.body.innerText.includes("Best window"), undefined, { timeout: 10_000 });
    }
    const enText = await pageText(page);
    assertIncludes(enText, item.enExpected, `${item.path} en`);
    if (item.backAria) {
      const backControl = page.getByLabel(item.backAria.en).first();
      const aria = await backControl.getAttribute("aria-label");
      if (aria !== item.backAria.en) {
        throw new Error(`${item.path} en: expected back control aria-label ${JSON.stringify(item.backAria.en)}, got ${JSON.stringify(aria)}`);
      }
    }
  }

  console.log("i18n UX copy smoke passed", { baseUrl, pages: cases.map((item) => item.path) });
} finally {
  await browser.close();
}
