import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const routes = [
  "/",
  "/reading",
  "/reading/start",
  "/reading/result",
  "/reports",
  "/membership",
  "/ai-question",
  "/relationship-lite",
  "/daily-timing",
  "/tools",
  "/samples",
  "/samples/en-career-pivot?lang=en",
  "/paywall",
  "/crush-reading",
  "/tarot",
  "/ritual",
  "/daily-ritual",
  "/learn/bazi-basics",
  "/free-bazi-calculator",
  "/five-elements-calculator",
  "/chinese-birth-chart",
  "/daily-chinese-horoscope",
  "/lucky-direction-today",
  "/compatibility",
  "/ask-master",
  "/profile",
  "/privacy",
  "/terms",
  "/account/delete",
];
const reportDir = process.env.AUDIT_REPORT_DIR || "reports/evidence";
const selector = [
  "a",
  "button",
  '[role="button"]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
].join(",");

const viewports = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile390", width: 390, height: 844 },
];

function isGuardedAction(item) {
  const haystack = `${item.name || ""} ${item.href || ""}`.toLowerCase();
  return [
    "checkout",
    "stripe",
    "subscribe",
    "membership",
    "unlock",
    "delete",
    "logout",
    "log out",
    "sign out",
    "mailto:",
    "yishun://",
  ].some((term) => haystack.includes(term));
}

function routeUrl(route) {
  return new URL(route, baseUrl).toString();
}

function shortLabel(item) {
  return [item.tag, item.name || item.href || `#${item.index}`].join(":");
}

function isActionControl(item) {
  return item.tag === "button" || item.tag === "input" || item.role === "button";
}

async function collectInteractive(page) {
  return page.evaluate(() => {
    const interactiveSelector = [
      "a",
      "button",
      '[role="button"]',
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="reset"]',
    ].join(",");

    function elementName(element) {
      const aria = element.getAttribute("aria-label") || element.getAttribute("title") || "";
      const text = element.textContent || element.getAttribute("value") || "";
      return (aria || text).replace(/\s+/g, " ").trim();
    }

    return Array.from(document.querySelectorAll(interactiveSelector))
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const href = element instanceof HTMLAnchorElement ? element.href : null;
        const disabled = element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";
        const type = element.getAttribute("type") || null;
        return {
          index,
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute("role"),
          type,
          name: elementName(element),
          href,
          disabled,
          visible:
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            Number(style.opacity || "1") > 0,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      })
      .filter((item) => item.visible);
  });
}

async function safeClick(browser, route, viewport, item) {
  if (item.disabled) return { outcome: "skipped_disabled" };
  if (!isActionControl(item)) return { outcome: "link_status_checked" };
  if (isGuardedAction(item)) return { outcome: "guarded", reason: "payment_or_destructive_or_external" };

  const page = await browser.newPage({ viewport });
  const errors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    const response = await page.goto(routeUrl(route), { waitUntil: "networkidle", timeout: 30000 });
    const status = response?.status() ?? 0;
    if (status >= 400) return { outcome: "route_failed_before_click", status };

    const locator = page.locator(selector).nth(item.index);
    if (!(await locator.isVisible({ timeout: 3000 }).catch(() => false))) {
      return { outcome: "not_visible_at_click_time" };
    }

    await locator.click({ timeout: 8000, trial: true });
    await Promise.all([
      page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined),
      locator.click({ timeout: 8000 }),
    ]);
    await page.waitForTimeout(250);

    const currentUrl = page.url();
    const clickedStatus = page.url().startsWith("http") ? await page.evaluate(() => document.readyState).catch(() => "unknown") : "unknown";
    return {
      outcome: errors.length || consoleErrors.length ? "clicked_with_errors" : "clicked",
      currentUrl,
      readyState: clickedStatus,
      errors,
      consoleErrors,
    };
  } catch (error) {
    return {
      outcome: "click_failed",
      error: error instanceof Error ? error.message : String(error),
      errors,
      consoleErrors,
    };
  } finally {
    await page.close();
  }
}

async function auditRoute(browser, route, viewport) {
  const page = await browser.newPage({ viewport });
  const url = routeUrl(route);
  const failures = [];
  const warnings = [];

  try {
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const status = response?.status() ?? 0;
    if (status >= 400) failures.push(`route_status_${status}`);

    const items = await collectInteractive(page);
    for (const item of items) {
      if (!item.name && !item.href) failures.push(`unnamed_${item.tag}_${item.index}`);
      if (item.rect.width < 24 || item.rect.height < 24) warnings.push(`small_target_${item.name || item.href || item.index}`);
      if (item.href) {
        const parsed = new URL(item.href);
        if (parsed.origin === new URL(baseUrl).origin && parsed.pathname !== new URL(url).pathname) {
          const linkResponse = await page.request.get(item.href, { timeout: 15000 });
          if (linkResponse.status() >= 400) failures.push(`bad_link_${linkResponse.status()}_${item.href}`);
        }
      }
    }

    const clickResults = [];
    for (const item of items) {
      const result = await safeClick(browser, route, viewport, item);
      clickResults.push({ item: shortLabel(item), ...result });
      if (result.outcome === "click_failed" || result.outcome === "clicked_with_errors") {
        failures.push(`${result.outcome}_${item.tag}_${item.index}_${item.name || "unnamed"}`);
      }
    }

    return {
      route,
      viewport: viewport.name,
      status,
      title: await page.title(),
      interactiveCount: items.length,
      failures,
      warnings,
      guardedCount: clickResults.filter((result) => result.outcome === "guarded").length,
      clickedCount: clickResults.filter((result) => result.outcome === "clicked").length,
      items,
      clickResults,
    };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of viewports) {
  for (const route of routes) {
    console.error(`[audit:buttons] ${viewport.name} ${route}`);
    results.push(await auditRoute(browser, route, viewport));
  }
}

await browser.close();

const failed = results.filter((result) => result.failures.length > 0);
const summary = {
  ok: failed.length === 0,
  baseUrl,
  routeCount: routes.length,
  viewportCount: viewports.length,
  interactiveCount: results.reduce((sum, result) => sum + result.interactiveCount, 0),
  clickedCount: results.reduce((sum, result) => sum + result.clickedCount, 0),
  guardedCount: results.reduce((sum, result) => sum + result.guardedCount, 0),
  failureCount: failed.reduce((sum, result) => sum + result.failures.length, 0),
};
const payload = { ...summary, results };
await mkdir(reportDir, { recursive: true });
const reportPath = path.join(reportDir, `yishun-core-button-audit-${Date.now()}.json`);
await writeFile(reportPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(JSON.stringify({ ...summary, reportPath }, null, 2));

if (failed.length > 0) process.exit(1);
