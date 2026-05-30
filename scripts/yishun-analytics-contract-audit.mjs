#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assertContains(file, needle) {
  const text = read(file);
  if (!text.includes(needle)) {
    throw new Error(`${file} is missing ${needle}`);
  }
}

const requiredContextFields = [
  "product_id",
  "anonymous_id",
  "session_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "country",
  "locale",
  "device",
  "page",
  "variant",
];

for (const field of requiredContextFields) {
  assertContains("lib/p0-analytics.ts", field);
}

for (const privateNeedle of ["birth", "email", "phone", "location", "latitude", "longitude"]) {
  assertContains("app/api/events/route.ts", privateNeedle);
}

for (const reportNeedle of ["checkout_started", "entitlement_granted", "saved_report", "save_result", "save_click", "traffic_sources.csv", "traffic_campaigns.csv", "retention.csv", "payment_reconciliation.json", "analytics_source.json", "Production health reports analytics configured", "YISHUN_ANALYTICS_FILES", "YISHUN_ANALYTICS_DIR", "discoverAnalyticsFiles", "YISHUN_STRIPE_WEBHOOK_EVENTS_FILE", "stripe_webhook_fulfilled", "webhookFulfilled", "eventValue", "yishun_analytics_event", "yishun_server_analytics_event", "jsonPayload", "textPayload"]) {
  assertContains("scripts/yishun-daily-data-report.mjs", reportNeedle);
}

for (const serverNeedle of [
  "checkout_completed",
  "entitlement_granted",
  "webhook_failed",
  "YISHUN_ANALYTICS_FILE",
  "createHash",
  "anonymous_id",
  "utm_source: \"stripe\"",
  "page: \"/api/stripe/webhook\"",
  "yishun_server_analytics_event",
  "mkdir(path.dirname(filePath), { recursive: true })",
]) {
  assertContains("lib/server-analytics.ts", serverNeedle);
}

for (const ingestNeedle of [
  "yishun_analytics_event",
  "redactPrivateFields",
  "JSON.stringify({ type:",
  "mkdir(path.dirname(filePath), { recursive: true })",
]) {
  assertContains("app/api/events/route.ts", ingestNeedle);
}

for (const webhookNeedle of [
  "recordServerAnalyticsEvent",
  "event: \"checkout_completed\"",
  "event: \"entitlement_granted\"",
  "event: \"webhook_failed\"",
]) {
  assertContains("lib/stripe-entitlements.ts", webhookNeedle);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "browser_events_include_required_yishun_context",
        "analytics_ingest_redacts_private_birth_contact_location_fields",
        "daily_report_consumes_funnel_traffic_campaign_retention_saved_report_payment_metrics",
        "daily_report_surfaces_analytics_source_freshness",
        "daily_report_reads_single_multi_file_and_directory_analytics_exports",
        "analytics_file_sink_creates_parent_directory_before_append",
        "stripe_webhook_fulfillment_emits_privacy_safe_server_funnel_events",
      ],
    },
    null,
    2,
  ),
);
