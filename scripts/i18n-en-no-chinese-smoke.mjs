import { chromium } from "playwright";

const baseUrl = process.env.YISHUN_BASE_URL ?? process.env.SMOKE_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:3000";
const evidenceDir = process.env.EVIDENCE_DIR;
const chineseRe = /[\u3400-\u9fff]/;

const samplePreview = {
  birthProfile: {
    birthDate: "1990-01-01",
    birthTime: "08:30",
    birthTimeKnown: true,
    birthPlaceText: "Singapore",
    timezoneName: "Asia/Singapore",
    timezoneOffsetMinutes: -480,
  },
  trueSolarTime: {
    date: "1990-01-01",
    time: "08:18",
    offsetMinutes: -12.4,
    changedHourPillar: false,
    changedDayBoundary: false,
    precision: "city",
  },
  fourPillars: {
    year: { pillar: "Geng Wu" },
    month: { pillar: "Bing Zi" },
    day: { pillar: "Ding Mao" },
    hour: { pillar: "Jia Chen" },
  },
  dayMaster: "Ding Fire",
  elementsBalance: { wood: 3, fire: 4, earth: 2, metal: 1, water: 2 },
  dominantElement: "Fire",
  missingElement: "Metal",
  favorableElement: "Metal",
  tenGodPattern: { label: "Output", plain: "A practical pattern for turning ideas into visible action." },
  interpretation: {
    dayMasterDescription: "Ding Fire favors clear signals and careful pacing.",
    strengthAnalysis: "The chart has enough Fire to act, with Metal helping create structure.",
    favorableElements: ["Metal", "Earth"],
  },
  dailySignal: {
    score: 82,
    bestFor: ["planning", "focused outreach", "calm decisions"],
    do: "Choose one meaningful push and write the next step before you commit.",
    avoid: "Do not force a final answer before the options are clear.",
    bestHour: "07:00–09:00",
    luckyElement: "Metal",
    luckyDirection: "West",
    why: "Today supports clear planning because the rules engine sees a structured element balance.",
    deeperInsight: "Use the strong signal to make one practical choice rather than over-expanding the plan.",
    disclaimer: "For reflection only. Not financial, medical, legal, or life-critical advice.",
  },
  ai: {
    status: "ok",
    provider: "gemini",
    model: "gemini-test",
    attribution: "Gemini explains the rules-engine signal; it does not decide chart facts.",
    interpretationBasis: "Rules engine facts: birth profile, true solar time, Four Pillars, Day Master, Five Elements, and today signal.",
    summary: "Today favors a focused push during the morning window, with clear boundaries around over-commitment.",
    signalsUsed: ["birth profile", "true solar time", "four pillars", "day master", "five elements", "today signal"],
    actionSuggestions: ["Use the 07:00–09:00 window for one visible step.", "Write the next step before agreeing to a larger plan."],
    reflectionQuestion: "Which one action would make today feel clearly complete?",
    terminologyNote: "BaZi terms are used as timing language, not as fixed fate.",
  },
  focus: "General",
};

const sampleHistory = [{
  date: new Date().toISOString().slice(0, 10),
  score: 82,
  bestFor: ["planning", "focused outreach", "calm decisions"],
  focus: "General",
  savedAt: new Date().toISOString(),
  bestHour: "07:00–09:00",
  action: "Choose one meaningful push and write the next step before you commit.",
  avoid: "Do not force a final answer before the options are clear.",
}];

const pages = [
  { path: "/", name: "home", expect: ["Unlock your full destiny report", "Ask AI Master", "Check me and TA", "Draw today’s sign", "Start my free destiny preview"] },
  { path: "/reports", name: "reports", seedHistory: true, expect: ["Your saved signals", "Daily Ritual history", "Best window"] },
  { path: "/samples?lang=en", name: "samples", expect: ["Sample reports are product proof", "English samples", "Premium turns a sample signal into a plan users can keep"] },
  { path: "/samples/en-career-pivot?lang=en", name: "sample-en-career-pivot", expect: ["Career pivot timing sample", "Why this result", "Rules engine vs Gemini", "Premium value", "Retention path"] },
  { path: "/samples/zh-founder-launch?lang=en", name: "sample-zh-founder-launch-en", expect: ["Localized sample unavailable", "English mode does not render Chinese report text", "Open career sample"] },
  { path: "/tools?lang=en", name: "tools", expect: ["YiShun", "Tools"] },
  { path: "/tools/sample?lang=en", name: "tools-sample", expect: ["Consumer-grade upgrade", "rules engine vs Gemini", "tomorrow reminder"] },
  { path: "/reading/start", name: "reading-start", expect: ["Generate your free destiny preview", "Birth date", "Birth time"] },
  { path: "/reading/result", name: "reading-result", seedPreview: true, expect: ["Full Eastern Destiny Report Preview", "Today’s emotional read", "Best window", "Avoid", "One action", "Full report"] },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function seed(page, options = {}) {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.evaluate(({ preview, history, seedPreview, seedHistory }) => {
    window.localStorage.setItem("locale", "en");
    if (seedPreview) window.localStorage.setItem("yishun:p0Preview", JSON.stringify(preview));
    if (seedHistory) window.localStorage.setItem("yishun:dailyRitual:history", JSON.stringify(history));
    window.localStorage.setItem("yishun:dailyRitual:completedDate", new Date().toISOString().slice(0, 10));
  }, { preview: samplePreview, history: sampleHistory, ...options });
}

async function collectVisibleTextAndA11y(page) {
  const text = await page.locator("body").innerText();
  const attrs = await page.locator("body *").evaluateAll((nodes) => nodes.flatMap((node) => {
    const element = node;
    const rect = element.getBoundingClientRect?.();
    const visible = rect && rect.width > 0 && rect.height > 0;
    if (!visible) return [];
    return ["aria-label", "title", "placeholder", "alt"].map((name) => element.getAttribute?.(name)).filter(Boolean);
  }));
  return [text, ...attrs].join("\n").replace(/\s+/g, " ").trim();
}

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, locale: "en-US" });
  await context.addCookies([{ name: "locale", value: "en", url: baseUrl, sameSite: "Lax" }]);
  const page = await context.newPage();

  for (const item of pages) {
    await seed(page, { seedPreview: item.seedPreview, seedHistory: item.seedHistory });
    await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
    await page.locator("body").waitFor({ state: "attached", timeout: 10_000 });
    if (item.seedHistory) {
      await page.waitForFunction(() => document.body.innerText.includes("Best window"), undefined, { timeout: 10_000 });
    }
    const rendered = await collectVisibleTextAndA11y(page);
    for (const needle of item.expect) {
      assert(rendered.toLowerCase().includes(needle.toLowerCase()), `${item.path} missing expected English copy: ${needle}\n${rendered.slice(0, 1000)}`);
    }
    if (chineseRe.test(rendered)) {
      failures.push({ path: item.path, matched: rendered.match(chineseRe)?.[0], text: rendered.slice(0, 1200) });
    }
    if (evidenceDir) {
      await page.screenshot({ path: `${evidenceDir}/${item.name}.png`, fullPage: true });
    }
  }

  assert(failures.length === 0, `English pages contain Chinese characters:\n${JSON.stringify(failures, null, 2)}`);
  console.log(JSON.stringify({ ok: true, baseUrl, checked: pages.map((item) => item.path), evidenceDir: evidenceDir ?? null }, null, 2));
} finally {
  await browser.close();
}
