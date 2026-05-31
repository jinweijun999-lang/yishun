#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const DEFAULT_BASE_URL = "https://11263.com";
const DEFAULT_OUT = "reports/evidence/yishun-consumer-ai-qa-latest.json";

const forbiddenConsumerCopy = [
  /\bmock\b/i,
  /\bplaceholder\b/i,
  /\blocal\b/i,
  /\bP0\b/,
  /\btest checkout\b/i,
  /\bsandbox pending\b/i,
];

const routes = [
  {
    route: "/",
    persona: "first-time mobile visitor",
    mustInclude: ["YiShun"],
    needsAction: true,
    strictCopy: true,
  },
  {
    route: "/reading/start",
    persona: "first-time reading starter",
    mustInclude: ["YiShun"],
    needsAction: true,
    strictCopy: true,
  },
  {
    route: "/membership",
    persona: "paid user comparing plans",
    mustInclude: ["YiShun"],
    needsAction: true,
    strictCopy: true,
  },
  {
    route: "/status",
    persona: "cautious user checking service trust",
    mustInclude: ["YiShun"],
    needsAction: false,
    strictCopy: false,
  },
  {
    route: "/privacy",
    persona: "privacy-conscious paid user",
    mustInclude: ["Privacy"],
    needsAction: false,
    strictCopy: false,
  },
  {
    route: "/terms",
    persona: "paid user checking terms",
    mustInclude: ["Terms"],
    needsAction: false,
    strictCopy: false,
  },
];

function parseArgs() {
  const config = {
    baseUrl: process.env.YISHUN_CONSUMER_AI_QA_BASE_URL || process.env.YISHUN_PRODUCTION_BASE_URL || DEFAULT_BASE_URL,
    out: process.env.YISHUN_CONSUMER_AI_QA_OUT || DEFAULT_OUT,
    headed: process.argv.includes("--headed"),
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--base-url=")) config.baseUrl = arg.slice("--base-url=".length);
    if (arg.startsWith("--out=")) config.out = arg.slice("--out=".length);
  }

  return {
    ...config,
    baseUrl: config.baseUrl.replace(/\/+$/, ""),
  };
}

function assert(condition, message, details = {}) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

async function getVisibleText(page) {
  return page.locator("body").innerText({ timeout: 5000 });
}

async function inspectRoute(page, baseUrl, spec) {
  const url = `${baseUrl}${spec.route}`;
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
  assert(response?.ok(), "Route must return 2xx in browser QA", { route: spec.route, status: response?.status() });

  const text = await getVisibleText(page);
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
    visibleButtons: Array.from(document.querySelectorAll("button,a"))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width >= 32 && rect.height >= 24 && style.visibility !== "hidden" && style.display !== "none";
      })
      .slice(0, 20)
      .map((el) => el.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) || el.getAttribute("aria-label") || el.getAttribute("href") || "unnamed action"),
  }));

  for (const required of spec.mustInclude) {
    assert(
      text.toLowerCase().includes(required.toLowerCase()),
      "Consumer route is missing expected public copy",
      { route: spec.route, required },
    );
  }

  assert(metrics.scrollWidth <= metrics.width + 2, "Mobile viewport must not have horizontal overflow", {
    route: spec.route,
    width: metrics.width,
    scrollWidth: metrics.scrollWidth,
  });

  if (spec.needsAction) {
    assert(metrics.visibleButtons.length > 0, "Consumer route must expose at least one visible action", {
      route: spec.route,
      persona: spec.persona,
    });
  }

  if (spec.strictCopy) {
    for (const pattern of forbiddenConsumerCopy) {
      assert(!pattern.test(text), "Consumer purchase/onboarding route exposes internal or test copy", {
        route: spec.route,
        pattern: pattern.toString(),
      });
    }
  }

  return {
    route: spec.route,
    persona: spec.persona,
    status: response.status(),
    mobile: {
      width: metrics.width,
      scrollWidth: metrics.scrollWidth,
      visibleActions: metrics.visibleButtons,
    },
    copyLength: text.length,
  };
}

async function main() {
  const config = parseArgs();
  const browser = await chromium.launch({ headless: !config.headed });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent: "YiShun consumer-grade AI QA mobile reviewer",
  });

  const results = [];
  try {
    for (const route of routes) {
      results.push(await inspectRoute(page, config.baseUrl, route));
    }
  } finally {
    await browser.close();
  }

  const payload = {
    ok: true,
    baseUrl: config.baseUrl,
    checkedAt: new Date().toISOString(),
    principle: "AI reviewer validated the product from consumer personas, not only engineering health.",
    routes: results,
  };

  await mkdir(path.dirname(config.out), { recursive: true });
  await writeFile(config.out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(payload, null, 2));
}

main().catch(async (error) => {
  const config = parseArgs();
  const payload = {
    ok: false,
    baseUrl: config.baseUrl,
    checkedAt: new Date().toISOString(),
    message: error instanceof Error ? error.message : "Consumer AI QA failed",
    details: error?.details || {},
  };

  await mkdir(path.dirname(config.out), { recursive: true }).catch(() => {});
  await writeFile(config.out, `${JSON.stringify(payload, null, 2)}\n`, "utf8").catch(() => {});
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
});
