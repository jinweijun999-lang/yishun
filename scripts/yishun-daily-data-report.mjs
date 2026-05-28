#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const TIME_ZONE = "Asia/Shanghai";
const DEFAULT_HEALTH_URL = "https://11263.com/api/health";

const EVENT_ALIASES = {
  landing_viewed: ["landing_viewed", "home_view"],
  source_detected: ["source_detected"],
  reading_start_clicked: ["reading_start_clicked", "start_click", "start"],
  birth_info_submitted: ["birth_info_submitted", "form_submit", "submit"],
  reading_preview_generated: ["reading_preview_generated", "result"],
  reading_detail_opened: ["reading_detail_opened", "report_view"],
  pricing_viewed: ["pricing_viewed", "paywall", "click_paywall"],
  checkout_started: ["checkout_started", "checkout_start", "payment_intent"],
  checkout_completed: ["checkout_completed"],
  entitlement_granted: ["entitlement_granted", "unlock_success"],
  paid_report_viewed: ["paid_report_viewed"],
  daily_card_viewed: ["daily_card_viewed", "daily_timing_view", "ritual_view"],
  return_visit: ["return_visit", "reports_open", "streak_view"],
  share_clicked: ["share_clicked", "share_click", "share"],
  share_page_created: ["share_page_created"],
  share_page_viewed: ["share_page_viewed"],
  reading_failed: ["reading_failed"],
  checkout_failed: ["checkout_failed"],
  webhook_failed: ["webhook_failed"],
};

function cstDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    date: process.env.REPORT_DATE || cstDate(),
    noNetwork: args.has("--no-network") || process.env.YISHUN_REPORT_NO_NETWORK === "1",
    outRoot: process.env.YISHUN_DAILY_REPORT_DIR || path.join("reports", "daily"),
    analyticsFile: process.env.YISHUN_ANALYTICS_FILE || "",
    healthUrl: process.env.YISHUN_HEALTH_URL || DEFAULT_HEALTH_URL,
  };
}

function csv(rows) {
  return rows.map((row) => row.map((cell) => {
    const value = String(cell ?? "");
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(",")).join("\n") + "\n";
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value, fallback = "unknown") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 140) : fallback;
}

function eventDate(event) {
  const parsed = new Date(event.ts || event.timestamp || Date.now());
  return Number.isNaN(parsed.getTime()) ? cstDate() : cstDate(parsed);
}

async function readAnalyticsEvents(filePath, reportDate) {
  if (!filePath || !existsSync(filePath)) {
    return { events: [], note: filePath ? `analytics file not found: ${filePath}` : "YISHUN_ANALYTICS_FILE not configured" };
  }

  const text = await readFile(filePath, "utf8");
  const events = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (isRecord(event) && cleanString(event.event, "") && eventDate(event) === reportDate) {
        events.push(event);
      }
    } catch {
      // Ignore malformed analytics rows; the report records aggregate coverage only.
    }
  }
  return { events, note: null };
}

async function fetchHealth({ noNetwork, healthUrl }) {
  if (noNetwork) {
    return {
      ok: null,
      skipped: true,
      url: healthUrl,
      checkedAt: new Date().toISOString(),
      latencyMs: null,
      response: null,
      error: "network check skipped",
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(healthUrl, { signal: controller.signal, cache: "no-store" });
    const body = await response.json().catch(() => null);
    return {
      ok: response.ok && Boolean(body?.ok),
      skipped: false,
      url: healthUrl,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      status: response.status,
      response: body,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      url: healthUrl,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      response: null,
      error: error instanceof Error ? error.message : "health check failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

function countBy(values) {
  return values.reduce((acc, value) => {
    acc.set(value, (acc.get(value) || 0) + 1);
    return acc;
  }, new Map());
}

function canonicalEventCounts(events) {
  const rawCounts = countBy(events.map((event) => cleanString(event.event, "")));
  return Object.entries(EVENT_ALIASES).map(([canonical, aliases]) => ({
    event: canonical,
    count: aliases.reduce((sum, alias) => sum + (rawCounts.get(alias) || 0), 0),
    aliases: aliases.filter((alias) => rawCounts.has(alias)),
  }));
}

function property(event, key) {
  return isRecord(event.properties) ? event.properties[key] : undefined;
}

function topValues(events, keys, limit = 20) {
  const values = events.map((event) => {
    for (const key of keys) {
      const value = cleanString(property(event, key), "");
      if (value) return value;
    }
    return "unknown";
  });
  return [...countBy(values).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function analyticsSummary(events) {
  const anonymousIds = new Set(events.map((event) => cleanString(event.anonymous_id, "")).filter(Boolean));
  const sessions = new Set(events.map((event) => cleanString(property(event, "session_id"), "")).filter(Boolean));
  return {
    acceptedEvents: events.length,
    anonymousVisitors: anonymousIds.size,
    sessions: sessions.size,
    canonical: canonicalEventCounts(events),
    trafficSources: topValues(events, ["utm_source", "source", "referrer"]),
    topPages: topValues(events, ["page", "pathname", "route"]),
  };
}

async function readStripeWebhookSummary(reportDate) {
  if (!process.env.DATABASE_URL) {
    return {
      available: false,
      note: "DATABASE_URL not configured; Stripe webhook summary skipped",
      rows: [],
      failures: [],
    };
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const start = new Date(`${reportDate}T00:00:00+08:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const events = await prisma.stripeWebhookEvent.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { id: true, stripeEventType: true, product: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    await prisma.$disconnect();

    const rows = [...countBy(events.map((event) => `${event.product || "unknown"}|${event.status}`)).entries()]
      .map(([key, count]) => {
        const [product, status] = key.split("|");
        return { product, status, count };
      });
    const failures = events
      .filter((event) => /fail|error/i.test(event.status))
      .map((event) => ({
        id: event.id,
        stripeEventType: event.stripeEventType,
        product: event.product || "unknown",
        status: event.status,
        createdAt: event.createdAt.toISOString(),
      }));
    return { available: true, note: null, rows, failures };
  } catch (error) {
    return {
      available: false,
      note: error instanceof Error ? error.message : "Stripe webhook summary failed",
      rows: [],
      failures: [],
    };
  }
}

function anomalyNotes({ health, analytics, stripe }) {
  const notes = [];
  if (health.ok === false) notes.push(`Health check failed: ${health.error || health.status}`);
  if (health.ok === null) notes.push("Health check skipped for this local report run.");
  if (analytics.acceptedEvents === 0) notes.push("No analytics events found for the report date.");
  const checkoutStarted = analytics.canonical.find((item) => item.event === "checkout_started")?.count || 0;
  const entitlementGranted = analytics.canonical.find((item) => item.event === "entitlement_granted")?.count || 0;
  if (checkoutStarted > 0 && entitlementGranted === 0) notes.push("Checkout starts were observed without matching entitlement_granted events.");
  if (!stripe.available) notes.push(`Stripe webhook DB summary unavailable: ${stripe.note}`);
  if (stripe.failures.length > 0) notes.push(`${stripe.failures.length} Stripe webhook failure rows found.`);
  return notes;
}

function analystQuestions({ analytics, notes }) {
  const questions = [
    "Which channel produced the highest reading_start_clicked to reading_preview_generated conversion?",
    "Where do users drop between pricing_viewed, checkout_started, and entitlement_granted?",
    "Which pages produce share_clicked events and should get stronger share CTAs?",
  ];
  if (analytics.acceptedEvents === 0) questions.unshift("Is the production analytics file sink receiving events today?");
  if (notes.some((note) => note.includes("Checkout starts"))) questions.unshift("Do Stripe webhook records confirm entitlement fulfillment for observed checkout starts?");
  return questions;
}

async function main() {
  const config = parseArgs();
  const reportDir = path.join(config.outRoot, `yishun-daily-${config.date}`);
  await mkdir(reportDir, { recursive: true });

  const [analyticsInput, health, stripe] = await Promise.all([
    readAnalyticsEvents(config.analyticsFile, config.date),
    fetchHealth(config),
    readStripeWebhookSummary(config.date),
  ]);
  const analytics = analyticsSummary(analyticsInput.events);
  const notes = anomalyNotes({ health, analytics, stripe });
  const questions = analystQuestions({ analytics, notes });

  await writeFile(path.join(reportDir, "uptime.json"), JSON.stringify(health, null, 2));
  await writeFile(path.join(reportDir, "performance.json"), JSON.stringify({
    date: config.date,
    healthLatencyMs: health.latencyMs,
    healthOk: health.ok,
    acceptedAnalyticsEvents: analytics.acceptedEvents,
    note: "API latency and frontend performance need external APM/rum integration for p95 reporting.",
  }, null, 2));
  await writeFile(path.join(reportDir, "funnel.csv"), csv([
    ["event", "count", "observed_aliases"],
    ...analytics.canonical.map((item) => [item.event, item.count, item.aliases.join("|")]),
  ]));
  await writeFile(path.join(reportDir, "retention.csv"), csv([
    ["metric", "count"],
    ["anonymous_visitors", analytics.anonymousVisitors],
    ["sessions", analytics.sessions],
    ["daily_card_viewed", analytics.canonical.find((item) => item.event === "daily_card_viewed")?.count || 0],
    ["return_visit", analytics.canonical.find((item) => item.event === "return_visit")?.count || 0],
  ]));
  await writeFile(path.join(reportDir, "traffic_sources.csv"), csv([
    ["source", "events"],
    ...analytics.trafficSources,
  ]));
  await writeFile(path.join(reportDir, "top_pages.csv"), csv([
    ["page", "events"],
    ...analytics.topPages,
  ]));
  await writeFile(path.join(reportDir, "stripe_payments.csv"), csv([
    ["date", "product", "webhook_status", "count"],
    ...stripe.rows.map((row) => [config.date, row.product, row.status, row.count]),
  ]));
  await writeFile(path.join(reportDir, "stripe_webhook_failures.csv"), csv([
    ["id", "stripe_event_type", "product", "status", "created_at"],
    ...stripe.failures.map((event) => [event.id, event.stripeEventType, event.product, event.status, event.createdAt]),
  ]));
  await writeFile(path.join(reportDir, "errors.jsonl"), [
    ...analyticsInput.events
      .filter((event) => /fail|error/i.test(cleanString(event.event, "")))
      .map((event) => JSON.stringify({ event: event.event, ts: event.ts, source: event.source || null })),
    ...stripe.failures.map((event) => JSON.stringify({ event: "webhook_failed", ...event })),
  ].join("\n") + "\n");
  await writeFile(path.join(reportDir, "anomaly_notes.md"), notes.length ? notes.map((note) => `- ${note}`).join("\n") + "\n" : "- No anomalies detected from available local inputs.\n");
  await writeFile(path.join(reportDir, "analyst_questions.md"), questions.map((question) => `- ${question}`).join("\n") + "\n");
  await writeFile(path.join(reportDir, "summary.md"), `# YiShun Daily Report - ${config.date}

## Summary

- Health: ${health.ok === null ? "skipped" : health.ok ? "ok" : "failed"}
- Analytics events: ${analytics.acceptedEvents}${analyticsInput.note ? ` (${analyticsInput.note})` : ""}
- Anonymous visitors observed: ${analytics.anonymousVisitors}
- Checkout starts: ${analytics.canonical.find((item) => item.event === "checkout_started")?.count || 0}
- Entitlements granted: ${analytics.canonical.find((item) => item.event === "entitlement_granted")?.count || 0}
- Stripe webhook summary: ${stripe.available ? "available" : "unavailable"}

## Today Actions

${questions.map((question) => `- ${question}`).join("\n")}

## Files

- uptime.json
- performance.json
- errors.jsonl
- stripe_payments.csv
- stripe_webhook_failures.csv
- funnel.csv
- retention.csv
- traffic_sources.csv
- top_pages.csv
- anomaly_notes.md
- analyst_questions.md
`);

  console.log(JSON.stringify({
    ok: true,
    reportDir,
    date: config.date,
    analyticsEvents: analytics.acceptedEvents,
    healthOk: health.ok,
    stripeSummaryAvailable: stripe.available,
    notes,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
