#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const TIME_ZONE = "Asia/Shanghai";
const DEFAULT_HEALTH_URL = "https://11263.com/api/health";
const DEFAULT_ROUTE_CHECKS = [
  ["/", "YiShun"],
  ["/reading/start", "YiShun"],
  ["/membership", "YiShun"],
  ["/status", "YiShun Status"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
];

const EVENT_ALIASES = {
  landing_viewed: ["landing_viewed", "home_view"],
  source_detected: ["source_detected"],
  reading_start_clicked: ["reading_start_clicked", "start_click", "start", "ritual_start"],
  birth_info_submitted: ["birth_info_submitted", "form_submit", "submit", "ritual_submit"],
  reading_preview_generated: ["reading_preview_generated", "result", "ritual_complete"],
  reading_detail_opened: ["reading_detail_opened", "report_view", "reports_open"],
  pricing_viewed: ["pricing_viewed", "paywall", "click_paywall"],
  checkout_started: ["checkout_started", "checkout_start", "payment_intent"],
  checkout_completed: ["checkout_completed"],
  entitlement_granted: ["entitlement_granted", "unlock_success"],
  paid_report_viewed: ["paid_report_viewed"],
  daily_card_viewed: ["daily_card_viewed", "daily_timing_view", "ritual_view"],
  return_visit: ["return_visit", "reports_open", "streak_view"],
  saved_report: ["saved_report", "save_result", "save_click", "save"],
  share_clicked: ["share_clicked", "share_click", "share", "share_create_click", "share_landing_cta_click"],
  share_page_created: ["share_page_created", "share_link_created"],
  share_page_viewed: ["share_page_viewed", "share_landing_view"],
  reading_failed: ["reading_failed", "birth_form_error"],
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
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const dateFlagIndex = rawArgs.indexOf("--date");
  const dateArg = dateFlagIndex >= 0 ? rawArgs[dateFlagIndex + 1] : rawArgs.find((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
  const healthUrl = process.env.YISHUN_HEALTH_URL || DEFAULT_HEALTH_URL;
  return {
    date: process.env.REPORT_DATE || (/^\d{4}-\d{2}-\d{2}$/.test(dateArg || "") ? dateArg : cstDate()),
    noNetwork: args.has("--no-network") || process.env.YISHUN_REPORT_NO_NETWORK === "1",
    outRoot: process.env.YISHUN_DAILY_REPORT_DIR || path.join("reports", "daily"),
    analyticsFile: process.env.YISHUN_ANALYTICS_FILE || "",
    analyticsFiles: process.env.YISHUN_ANALYTICS_FILES || "",
    analyticsDir: process.env.YISHUN_ANALYTICS_DIR || "",
    stripeWebhookEventsFile: process.env.YISHUN_STRIPE_WEBHOOK_EVENTS_FILE || "",
    healthUrl,
    routeBaseUrl: (process.env.YISHUN_PRODUCTION_BASE_URL || new URL(healthUrl).origin).replace(/\/+$/, ""),
    routeTimeoutMs: Number(process.env.YISHUN_ROUTE_CHECK_TIMEOUT_MS || 8000),
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

function splitPathList(value) {
  return String(value || "")
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanString(value, fallback = "unknown") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 140) : fallback;
}

function eventDate(event) {
  const parsed = new Date(event.ts || event.timestamp || Date.now());
  return Number.isNaN(parsed.getTime()) ? cstDate() : cstDate(parsed);
}

function parseJsonMaybe(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd <= jsonStart) return null;
    try {
      return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
    } catch {
      return null;
    }
  }
}

function analyticsEventFromExportRecord(record) {
  if (!isRecord(record)) return null;
  if (typeof record.event === "string") return record;

  if (
    (record.type === "yishun_analytics_event" || record.type === "yishun_server_analytics_event") &&
    isRecord(record.event)
  ) {
    return record.event;
  }

  if (isRecord(record.jsonPayload)) {
    const nested = analyticsEventFromExportRecord(record.jsonPayload);
    if (nested) return nested;
  }

  for (const key of ["textPayload", "message", "log"]) {
    const parsed = parseJsonMaybe(record[key]);
    const nested = analyticsEventFromExportRecord(parsed);
    if (nested) return nested;
  }

  return null;
}

function isOperationalAnalyticsEvent(event) {
  const eventName = cleanString(event.event, "");
  return eventName.startsWith("ops_") ||
    cleanString(event.source, "") === "ops_probe" ||
    cleanString(eventValue(event, "utm_source"), "") === "ops_probe" ||
    cleanString(eventValue(event, "page"), "") === "/ops/analytics-probe";
}

async function discoverAnalyticsFiles(config) {
  const candidates = [
    config.analyticsFile,
    ...splitPathList(config.analyticsFiles),
  ].filter(Boolean);
  const notes = [];

  if (config.analyticsDir) {
    if (existsSync(config.analyticsDir)) {
      const entries = await readdir(config.analyticsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && /\.(json|jsonl|ndjson|log)$/i.test(entry.name) && !/\.meta\.json$/i.test(entry.name)) {
          candidates.push(path.join(config.analyticsDir, entry.name));
        }
      }
    } else {
      notes.push(`analytics dir not found: ${config.analyticsDir}`);
    }
  }

  const files = [...new Set(candidates)].filter((candidate) => {
    const found = existsSync(candidate);
    if (!found) notes.push(`analytics file not found: ${candidate}`);
    return found;
  });

  if (files.length === 0 && !config.analyticsFile && !config.analyticsFiles && !config.analyticsDir) {
    notes.push("YISHUN_ANALYTICS_FILE/YISHUN_ANALYTICS_FILES/YISHUN_ANALYTICS_DIR not configured");
  }

  return { files, notes };
}

function parseAnalyticsExportRecords(text) {
  const trimmed = text.trim();
  if (!trimmed) return { records: [], malformedRows: 0 };

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return { records: parsed, malformedRows: 0 };
    if (isRecord(parsed)) return { records: [parsed], malformedRows: 0 };
  } catch {
    // Fall back to line-oriented exports below.
  }

  const records = [];
  let malformedRows = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      malformedRows += 1;
    }
  }

  return { records, malformedRows };
}

async function readAnalyticsExportMetadata(files) {
  const metadata = [];

  for (const filePath of files) {
    const parsed = path.parse(filePath);
    const candidates = [
      path.join(parsed.dir, `${parsed.name}.meta.json`),
      `${filePath}.meta.json`,
    ];
    const metaPath = candidates.find((candidate) => existsSync(candidate));
    if (!metaPath) continue;

    try {
      const parsedMeta = JSON.parse(await readFile(metaPath, "utf8"));
      if (!isRecord(parsedMeta)) continue;
      metadata.push({
        sourceFile: filePath,
        metaPath,
        date: cleanString(parsedMeta.date, ""),
        project: cleanString(parsedMeta.project, ""),
        start: cleanString(parsedMeta.start, ""),
        end: cleanString(parsedMeta.end, ""),
        entryCount: Number(parsedMeta.entryCount || 0),
        eventCount: Number(parsedMeta.eventCount || 0),
        timeoutMs: Number(parsedMeta.timeoutMs || 0),
        allowEmpty: Boolean(parsedMeta.allowEmpty),
        generatedAt: cleanString(parsedMeta.generatedAt, ""),
      });
    } catch {
      metadata.push({
        sourceFile: filePath,
        metaPath,
        error: "analytics export metadata was not valid JSON",
      });
    }
  }

  return metadata;
}

async function readAnalyticsEvents(config, reportDate) {
  const input = await discoverAnalyticsFiles(config);
  const events = [];
  let parsedRows = 0;
  let malformedRows = 0;
  let rawReportDateEvents = 0;
  let operationalProbeEvents = 0;
  let oldestEventAt = null;
  let latestEventAt = null;

  for (const filePath of input.files) {
    const text = await readFile(filePath, "utf8");
    const parsedExport = parseAnalyticsExportRecords(text);
    malformedRows += parsedExport.malformedRows;

    for (const record of parsedExport.records) {
      try {
        const event = analyticsEventFromExportRecord(record);
        if (isRecord(event) && cleanString(event.event, "")) {
          parsedRows += 1;
          const rawTimestamp = event.ts || event.timestamp || null;
          const parsedTimestamp = new Date(rawTimestamp || Date.now());
          const eventAt = Number.isNaN(parsedTimestamp.getTime()) ? null : parsedTimestamp.toISOString();
          if (eventAt && (!oldestEventAt || eventAt < oldestEventAt)) oldestEventAt = eventAt;
          if (eventAt && (!latestEventAt || eventAt > latestEventAt)) latestEventAt = eventAt;
          if (eventDate(event) === reportDate) {
            rawReportDateEvents += 1;
            if (isOperationalAnalyticsEvent(event)) {
              operationalProbeEvents += 1;
            } else {
              events.push(event);
            }
          }
        }
      } catch {
        malformedRows += 1;
        // Ignore malformed analytics rows; the report records aggregate coverage only.
      }
    }
  }

  const exportMeta = await readAnalyticsExportMetadata(input.files);

  return {
    events,
    note: input.notes.join("; ") || null,
    source: {
      configured: Boolean(config.analyticsFile || config.analyticsFiles || config.analyticsDir),
      available: input.files.length > 0,
      files: input.files,
      fileCount: input.files.length,
      parsedRows,
      malformedRows,
      reportDateEvents: events.length,
      rawReportDateEvents,
      operationalProbeEvents,
      oldestEventAt,
      latestEventAt,
      exportMeta,
    },
  };
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

async function fetchTextRoute(url, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    const text = await response.text().catch(() => "");
    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - started,
      text,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      text: "",
      error: error instanceof Error ? error.message : "route check failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRouteStatus({ noNetwork, routeBaseUrl, routeTimeoutMs }) {
  const checkedAt = new Date().toISOString();
  if (noNetwork) {
    return {
      ok: null,
      skipped: true,
      baseUrl: routeBaseUrl,
      checkedAt,
      routes: DEFAULT_ROUTE_CHECKS.map(([route, requiredText]) => ({
        route,
        requiredText,
        ok: null,
        skipped: true,
        status: null,
        latencyMs: null,
        requiredTextPresent: null,
        error: "network check skipped",
      })),
    };
  }

  const routes = [];
  for (const [route, requiredText] of DEFAULT_ROUTE_CHECKS) {
    const result = await fetchTextRoute(`${routeBaseUrl}${route}`, routeTimeoutMs);
    routes.push({
      route,
      requiredText,
      ok: result.ok && result.text.includes(requiredText),
      skipped: false,
      status: result.status,
      latencyMs: result.latencyMs,
      requiredTextPresent: result.text ? result.text.includes(requiredText) : false,
      error: result.error,
    });
  }

  return {
    ok: routes.every((route) => route.ok),
    skipped: false,
    baseUrl: routeBaseUrl,
    checkedAt,
    routes,
  };
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

function eventValue(event, key) {
  const nested = property(event, key);
  return nested === undefined || nested === null || nested === "" ? event[key] : nested;
}

function parseStripeWebhookRecord(raw) {
  if (!isRecord(raw)) return null;
  const createdAt = cleanString(raw.createdAt ?? raw.created_at ?? raw.timestamp ?? raw.ts, "");
  return {
    id: cleanString(raw.id ?? raw.eventId ?? raw.event_id, ""),
    stripeEventType: cleanString(raw.stripeEventType ?? raw.stripe_event_type ?? raw.type, "unknown"),
    product: cleanString(raw.product, "unknown"),
    status: cleanString(raw.status, "unknown"),
    createdAt: createdAt || new Date().toISOString(),
  };
}

function isStripeWebhookAnalyticsEvent(event) {
  return cleanString(event.source, "") === "stripe_webhook" ||
    cleanString(eventValue(event, "page"), "") === "/api/stripe/webhook" ||
    cleanString(eventValue(event, "webhookStatus"), "") !== "";
}

function stripeWebhookEventsFromAnalytics(events) {
  const webhookEvents = events.filter(isStripeWebhookAnalyticsEvent);
  const fulfilledSessionIds = new Set(
    webhookEvents
      .filter((event) => {
        const eventName = cleanString(event.event, "");
        const status = cleanString(eventValue(event, "webhookStatus"), "");
        return eventName === "entitlement_granted" && status === "fulfilled";
      })
      .map((event) => cleanString(property(event, "session_id"), ""))
      .filter(Boolean),
  );

  return webhookEvents
    .filter((event) => {
      const eventName = cleanString(event.event, "");
      const status = cleanString(eventValue(event, "webhookStatus"), "");
      if (eventName === "webhook_failed") return true;
      if (eventName === "entitlement_granted" && status === "fulfilled") return true;
      if (eventName === "checkout_completed" && status === "fulfilled") {
        const sessionId = cleanString(property(event, "session_id"), "");
        return !sessionId || !fulfilledSessionIds.has(sessionId);
      }
      return false;
    })
    .map((event) => {
      const eventName = cleanString(event.event, "");
      const webhookStatus = cleanString(eventValue(event, "webhookStatus"), "unknown");
      return {
        id: cleanString(eventValue(event, "stripeEventId"), "") ||
          cleanString(property(event, "session_id"), "") ||
          cleanString(event.ts, ""),
        stripeEventType: cleanString(eventValue(event, "stripeEventType"), "unknown"),
        product: cleanString(eventValue(event, "product"), "unknown"),
        status: eventName === "webhook_failed" && webhookStatus === "unknown" ? "failed" : webhookStatus,
        createdAt: cleanString(event.ts || event.timestamp, "") || new Date().toISOString(),
      };
    });
}

async function readStripeWebhookEventsFile(filePath, reportDate) {
  if (!filePath || !existsSync(filePath)) {
    return {
      available: false,
      note: filePath ? `Stripe webhook events file not found: ${filePath}` : "YISHUN_STRIPE_WEBHOOK_EVENTS_FILE not configured",
      events: [],
    };
  }

  const text = await readFile(filePath, "utf8");
  const events = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = parseStripeWebhookRecord(JSON.parse(line));
      if (event && cstDate(new Date(event.createdAt)) === reportDate) events.push(event);
    } catch {
      // Ignore malformed exported webhook rows; DB remains the preferred source.
    }
  }

  return { available: true, note: null, events };
}

function topValues(events, keys, limit = 20) {
  const values = events.map((event) => {
    for (const key of keys) {
      const value = cleanString(eventValue(event, key), "");
      if (value) return value;
    }
    return "unknown";
  });
  return [...countBy(values).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function topCampaigns(events, limit = 30) {
  const values = events.map((event) => {
    const source = cleanString(eventValue(event, "utm_source"), "") || cleanString(eventValue(event, "source"), "unknown");
    return JSON.stringify([
      source,
      cleanString(eventValue(event, "utm_medium"), "unknown"),
      cleanString(eventValue(event, "utm_campaign"), "unknown"),
    ]);
  });
  return [...countBy(values).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => {
      const [source, medium, campaign] = JSON.parse(key);
      return [source, medium, campaign, count];
    });
}

function analyticsSummary(events) {
  const anonymousIds = new Set(events.map((event) => cleanString(event.anonymous_id, "")).filter(Boolean));
  const sessions = new Set(events.map((event) => cleanString(property(event, "session_id"), "")).filter(Boolean));
  const serverWebhookEntitlementGranted = events.filter((event) => {
    const eventName = cleanString(event.event, "");
    return EVENT_ALIASES.entitlement_granted.includes(eventName) &&
      (cleanString(event.source, "") === "stripe_webhook" || cleanString(eventValue(event, "page"), "") === "/api/stripe/webhook");
  }).length;
  return {
    acceptedEvents: events.length,
    anonymousVisitors: anonymousIds.size,
    sessions: sessions.size,
    serverWebhookEntitlementGranted,
    canonical: canonicalEventCounts(events),
    trafficSources: topValues(events, ["utm_source", "source", "referrer"]),
    trafficCampaigns: topCampaigns(events),
    topPages: topValues(events, ["page", "pathname", "route"]),
  };
}

function canonicalCount(analytics, eventName) {
  return analytics.canonical.find((item) => item.event === eventName)?.count || 0;
}

function stripeWebhookSummaryFromEvents(events, source) {
  const rows = [...countBy(events.map((event) => `${event.product || "unknown"}|${event.status}`)).entries()]
    .map(([key, count]) => {
      const [product, status] = key.split("|");
      return { product, status, count };
    });
  const failures = events
    .filter((event) => !["fulfilled", "duplicate_session"].includes(event.status) || /fail|error/i.test(event.status))
    .map((event) => ({
      id: event.id,
      stripeEventType: event.stripeEventType,
      product: event.product || "unknown",
      status: event.status,
      createdAt: event.createdAt,
    }));
  return { available: true, note: null, rows, failures, source };
}

async function readStripeWebhookSummary(reportDate, eventsFilePath, analyticsEvents = []) {
  function analyticsFallback(reason) {
    const analyticsWebhookEvents = stripeWebhookEventsFromAnalytics(analyticsEvents);
    if (analyticsWebhookEvents.length > 0) {
      return stripeWebhookSummaryFromEvents(analyticsWebhookEvents, "analytics_export");
    }
    return {
      available: false,
      note: reason,
      rows: [],
      failures: [],
      source: "unavailable",
    };
  }

  async function fileFallback(reason) {
    const fileInput = await readStripeWebhookEventsFile(eventsFilePath, reportDate);
    if (fileInput.available) return stripeWebhookSummaryFromEvents(fileInput.events, "file_export");
    return analyticsFallback(`${reason}; ${fileInput.note}; no Stripe webhook server analytics events found`);
  }

  if (!process.env.DATABASE_URL) {
    return fileFallback("DATABASE_URL not configured");
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

    return stripeWebhookSummaryFromEvents(
      events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
      "database",
    );
  } catch (error) {
    return fileFallback(error instanceof Error ? error.message : "Stripe webhook summary failed");
  }
}

function stripeStatusCount(stripe, status) {
  return stripe.rows
    .filter((row) => row.status === status)
    .reduce((sum, row) => sum + row.count, 0);
}

function funnelRows(analytics, payment) {
  return analytics.canonical.map((item) => {
    if (item.event === "entitlement_granted" && payment.webhookFulfilled > 0) {
      return {
        ...item,
        count: payment.entitlementGranted,
        aliases: [...item.aliases, "stripe_webhook_fulfilled"],
      };
    }
    if (item.event === "webhook_failed" && payment.webhookFailures > 0) {
      return {
        ...item,
        count: item.count + payment.webhookFailures,
        aliases: [...item.aliases, "stripe_webhook_failure"],
      };
    }
    return item;
  });
}

function paymentReconciliation({ analytics, stripe }) {
  const checkoutStarted = canonicalCount(analytics, "checkout_started");
  const checkoutCompleted = canonicalCount(analytics, "checkout_completed");
  const analyticsEntitlementGranted = canonicalCount(analytics, "entitlement_granted");
  const analyticsWebhookEntitlementGranted = analytics.serverWebhookEntitlementGranted || 0;
  const browserAnalyticsEntitlementGranted = Math.max(0, analyticsEntitlementGranted - analyticsWebhookEntitlementGranted);
  const webhookFulfilled = stripeStatusCount(stripe, "fulfilled");
  const webhookDuplicateSessions = stripeStatusCount(stripe, "duplicate_session");
  const webhookFailures = stripe.failures.length;
  const entitlementGranted = stripe.available
    ? browserAnalyticsEntitlementGranted + webhookFulfilled
    : analyticsEntitlementGranted;
  const analyticsHasCheckoutWithoutGrant = checkoutStarted > 0 && entitlementGranted === 0;
  const webhookHasCheckoutWithoutFulfillment = checkoutStarted > 0 && stripe.available && webhookFulfilled === 0;
  const webhookHasFailures = webhookFailures > 0;
  const missingWebhookData = !stripe.available;

  let risk = "clear";
  if (webhookHasFailures || webhookHasCheckoutWithoutFulfillment) risk = "action_required";
  else if (analyticsHasCheckoutWithoutGrant || missingWebhookData || webhookDuplicateSessions > 0) risk = "watch";

  return {
    risk,
    checkoutStarted,
    checkoutCompleted,
    analyticsEntitlementGranted,
    analyticsWebhookEntitlementGranted,
    browserAnalyticsEntitlementGranted,
    entitlementGranted,
    webhookFulfilled,
    webhookDuplicateSessions,
    webhookFailures,
    stripeSummaryAvailable: stripe.available,
    stripeSummarySource: stripe.source || "unavailable",
    stripeSummaryNote: stripe.note,
    checks: {
      analyticsHasCheckoutWithoutGrant,
      webhookHasCheckoutWithoutFulfillment,
      webhookHasFailures,
      missingWebhookData,
      duplicateSessionsObserved: webhookDuplicateSessions > 0,
    },
  };
}

function analyticsConfiguredInHealth(health) {
  return health.response?.checks?.analytics === "configured";
}

function anomalyNotes({ health, routeStatus, analyticsInput, analytics, stripe, payment, reportDate }) {
  const notes = [];
  if (health.ok === false) notes.push(`Health check failed: ${health.error || health.status}`);
  if (health.ok === null) notes.push("Health check skipped for this local report run.");
  if (routeStatus.ok === false) {
    const failedRoutes = routeStatus.routes
      .filter((route) => route.ok === false)
      .map((route) => `${route.route}=${route.status || route.error || "failed"}`)
      .join(", ");
    notes.push(`Core route check failed: ${failedRoutes}`);
  }
  if (routeStatus.ok === null || routeStatus.skipped) notes.push("Core route check skipped for this local report run.");
  if (!analyticsInput.source.available) {
    notes.push(`Analytics source unavailable for daily reporting: ${analyticsInput.note}`);
  }
  if (analyticsConfiguredInHealth(health) && !analyticsInput.source.available) {
    notes.push("Production health reports analytics configured, but this report has no event export source; do not treat zero events as confirmed zero traffic.");
  }
  if (analytics.acceptedEvents === 0) notes.push("No analytics events found for the report date.");
  for (const meta of analyticsInput.source.exportMeta || []) {
    if (meta.date && meta.date !== reportDate) continue;
    if (meta.error) {
      notes.push(`Analytics export metadata unreadable for ${meta.sourceFile}: ${meta.error}`);
      continue;
    }
    if (meta.entryCount === 0) {
      notes.push(`GCP analytics export returned 0 Cloud Logging entries for ${meta.date || reportDate}.`);
    } else if (meta.eventCount === 0) {
      notes.push(`GCP analytics export returned ${meta.entryCount} Cloud Logging entries but 0 parsed YiShun events; inspect log payload shape.`);
    } else if (meta.eventCount !== analyticsInput.source.rawReportDateEvents) {
      notes.push(`GCP analytics export parsed ${meta.eventCount} YiShun events, but ${analyticsInput.source.rawReportDateEvents} matched report date ${reportDate}.`);
    }
  }
  if (
    analyticsInput.source.latestEventAt &&
    analytics.acceptedEvents === 0 &&
    cstDate(new Date(analyticsInput.source.latestEventAt)) !== reportDate
  ) {
    notes.push(`Latest analytics export event is ${analyticsInput.source.latestEventAt}, outside report date ${reportDate}.`);
  }
  if (analyticsInput.source.operationalProbeEvents > 0 && analytics.acceptedEvents === 0) {
    notes.push(`${analyticsInput.source.operationalProbeEvents} operational analytics probe events were excluded from product funnel metrics.`);
  }
  if (analyticsInput.source.malformedRows > 0) notes.push(`${analyticsInput.source.malformedRows} malformed analytics export rows were ignored.`);
  if (payment.checks.analyticsHasCheckoutWithoutGrant) notes.push("Checkout starts were observed without matching entitlement_granted events.");
  if (payment.browserAnalyticsEntitlementGranted === 0 && payment.webhookFulfilled > 0) {
    notes.push("Stripe webhook fulfillments supplied entitlement_granted counts not observed in browser analytics.");
  }
  if (payment.checks.webhookHasCheckoutWithoutFulfillment) notes.push("Checkout starts were observed but no fulfilled Stripe webhook rows were found for the report date.");
  if (payment.checks.duplicateSessionsObserved) notes.push(`${payment.webhookDuplicateSessions} duplicate Stripe checkout session webhook rows were observed.`);
  if (!stripe.available) notes.push(`Stripe webhook DB summary unavailable: ${stripe.note}`);
  if (stripe.failures.length > 0) notes.push(`${stripe.failures.length} Stripe webhook failure rows found.`);
  return notes;
}

function analystQuestions({ analytics, analyticsInput, notes }) {
  const questions = [
    "Which channel produced the highest reading_start_clicked to reading_preview_generated conversion?",
    "Where do users drop between pricing_viewed, checkout_started, and entitlement_granted?",
    "Which save surface creates the most saved_report retention signals?",
    "Which pages produce share_clicked events and should get stronger share CTAs?",
  ];
  if (analytics.acceptedEvents === 0) questions.unshift("Is the production analytics file sink receiving events today?");
  if (analytics.acceptedEvents === 0 && analyticsInput.source.operationalProbeEvents > 0) {
    questions.unshift("The analytics pipeline accepted ops probes; which product surfaces still need live event traffic?");
  }
  if (notes.some((note) => note.includes("Checkout starts"))) questions.unshift("Do Stripe webhook records confirm entitlement fulfillment for observed checkout starts?");
  return questions;
}

async function main() {
  const config = parseArgs();
  const reportDir = path.join(config.outRoot, `yishun-daily-${config.date}`);
  await mkdir(reportDir, { recursive: true });

  const [analyticsInput, health] = await Promise.all([
    readAnalyticsEvents(config, config.date),
    fetchHealth(config),
  ]);
  const stripe = await readStripeWebhookSummary(config.date, config.stripeWebhookEventsFile, analyticsInput.events);
  const routeStatus = await fetchRouteStatus(config);
  const analytics = analyticsSummary(analyticsInput.events);
  const payment = paymentReconciliation({ analytics, stripe });
  const enrichedFunnelRows = funnelRows(analytics, payment);
  const analyticsSource = {
    date: config.date,
    healthAnalyticsStatus: health.response?.checks?.analytics || null,
    note: analyticsInput.note,
    ...analyticsInput.source,
  };
  const reportDateExportMeta = (analyticsSource.exportMeta || []).filter((meta) => !meta.date || meta.date === config.date);
  const notes = anomalyNotes({ health, routeStatus, analyticsInput, analytics, stripe, payment, reportDate: config.date });
  const questions = analystQuestions({ analytics, analyticsInput, notes });

  await writeFile(path.join(reportDir, "uptime.json"), JSON.stringify(health, null, 2));
  await writeFile(path.join(reportDir, "route_status.json"), JSON.stringify(routeStatus, null, 2));
  await writeFile(path.join(reportDir, "analytics_source.json"), JSON.stringify(analyticsSource, null, 2));
  await writeFile(path.join(reportDir, "performance.json"), JSON.stringify({
    date: config.date,
    healthLatencyMs: health.latencyMs,
    healthOk: health.ok,
    routeLatenciesMs: routeStatus.routes.map((route) => ({
      route: route.route,
      latencyMs: route.latencyMs,
      ok: route.ok,
    })),
    acceptedAnalyticsEvents: analytics.acceptedEvents,
    note: "API latency and frontend performance need external APM/rum integration for p95 reporting.",
  }, null, 2));
  await writeFile(path.join(reportDir, "funnel.csv"), csv([
    ["event", "count", "observed_aliases"],
    ...enrichedFunnelRows.map((item) => [item.event, item.count, item.aliases.join("|")]),
  ]));
  await writeFile(path.join(reportDir, "retention.csv"), csv([
    ["metric", "count"],
    ["anonymous_visitors", analytics.anonymousVisitors],
    ["sessions", analytics.sessions],
    ["daily_card_viewed", analytics.canonical.find((item) => item.event === "daily_card_viewed")?.count || 0],
    ["return_visit", analytics.canonical.find((item) => item.event === "return_visit")?.count || 0],
    ["saved_report", analytics.canonical.find((item) => item.event === "saved_report")?.count || 0],
  ]));
  await writeFile(path.join(reportDir, "traffic_sources.csv"), csv([
    ["source", "events"],
    ...analytics.trafficSources,
  ]));
  await writeFile(path.join(reportDir, "traffic_campaigns.csv"), csv([
    ["utm_source", "utm_medium", "utm_campaign", "events"],
    ...analytics.trafficCampaigns,
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
  await writeFile(path.join(reportDir, "payment_reconciliation.json"), JSON.stringify(payment, null, 2));
  await writeFile(path.join(reportDir, "payment_reconciliation.csv"), csv([
    ["metric", "value"],
    ["risk", payment.risk],
    ["checkout_started", payment.checkoutStarted],
    ["checkout_completed", payment.checkoutCompleted],
    ["analytics_entitlement_granted", payment.analyticsEntitlementGranted],
    ["analytics_webhook_entitlement_granted", payment.analyticsWebhookEntitlementGranted],
    ["browser_analytics_entitlement_granted", payment.browserAnalyticsEntitlementGranted],
    ["entitlement_granted", payment.entitlementGranted],
    ["webhook_fulfilled", payment.webhookFulfilled],
    ["webhook_duplicate_sessions", payment.webhookDuplicateSessions],
    ["webhook_failures", payment.webhookFailures],
    ["stripe_summary_available", payment.stripeSummaryAvailable],
    ["stripe_summary_source", payment.stripeSummarySource],
    ["stripe_summary_note", payment.stripeSummaryNote || ""],
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
- Core routes: ${routeStatus.ok === null ? "skipped" : routeStatus.ok ? "ok" : "failed"}
- Analytics events: ${analytics.acceptedEvents}${analyticsInput.note ? ` (${analyticsInput.note})` : ""}
- Analytics source: ${analyticsSource.available ? `available (${analyticsSource.reportDateEvents} report-date events, ${analyticsSource.parsedRows} parsed rows)` : `unavailable (${analyticsInput.note})`}
- Analytics export meta: ${reportDateExportMeta.length ? reportDateExportMeta.map((meta) => meta.error ? `${path.basename(meta.sourceFile)} metadata error` : `${path.basename(meta.sourceFile)} entries=${meta.entryCount} events=${meta.eventCount}`).join("; ") : "none"}
- Anonymous visitors observed: ${analytics.anonymousVisitors}
- Checkout starts: ${analytics.canonical.find((item) => item.event === "checkout_started")?.count || 0}
- Entitlements granted: ${payment.entitlementGranted}
- Saved reports: ${analytics.canonical.find((item) => item.event === "saved_report")?.count || 0}
- Stripe webhook summary: ${stripe.available ? `available (${payment.stripeSummarySource})` : "unavailable"}
- Payment reconciliation: ${payment.risk}

## Today Actions

${questions.map((question) => `- ${question}`).join("\n")}

## Files

- uptime.json
- route_status.json
- analytics_source.json
- performance.json
- errors.jsonl
- stripe_payments.csv
- stripe_webhook_failures.csv
- payment_reconciliation.json
- payment_reconciliation.csv
- funnel.csv
- retention.csv
- traffic_sources.csv
- traffic_campaigns.csv
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
    routeStatusOk: routeStatus.ok,
    analyticsSourceAvailable: analyticsSource.available,
    analyticsExportMeta: analyticsSource.exportMeta,
    stripeSummaryAvailable: stripe.available,
    stripeSummarySource: payment.stripeSummarySource,
    paymentRisk: payment.risk,
    entitlementsGranted: payment.entitlementGranted,
    notes,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
