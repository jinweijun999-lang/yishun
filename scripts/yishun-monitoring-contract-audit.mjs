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

function assertMatches(file, pattern, label) {
  const text = read(file);
  if (!pattern.test(text)) {
    throw new Error(`${file} is missing ${label}`);
  }
}

for (const healthNeedle of [
  "runtime = \"nodejs\"",
  "dynamic = \"force-dynamic\"",
  "getYiShunHealthSnapshot",
  "NextResponse.json",
  "\"Cache-Control\": \"no-store\"",
]) {
  assertContains("app/api/health/route.ts", healthNeedle);
}

for (const sharedHealthNeedle of [
  "export async function getYiShunHealthSnapshot",
  "version: appVersion()",
  "process.env.YISHUN_RELEASE_SHA",
  ".yishun-release-sha",
  "time: new Date().toISOString()",
  "configStatus",
  "process.env.STRIPE_SECRET_KEY",
  "process.env.STRIPE_PRICE_REPORT_SINGLE",
  "process.env.NEXT_PUBLIC_YISHUN_ANALYTICS_ENDPOINT",
  "process.env.YISHUN_ANALYTICS_FILE",
  "process.env.YISHUN_ANALYTICS_FILES",
  "process.env.YISHUN_ANALYTICS_DIR",
  "databaseOk && stripeOk && analyticsOk",
  "checks: {",
  "database",
  "stripe",
  "analytics",
]) {
  assertContains("lib/yishun-health.ts", sharedHealthNeedle);
}

for (const statusPageNeedle of [
  "YiShun Status",
  "Public Status",
  "getYiShunHealthSnapshot",
  "no secrets, database URLs, user data, payment details, or private analytics rows",
]) {
  assertContains("app/status/page.tsx", statusPageNeedle);
}

assertContains("app/sitemap.ts", "\"/status\"");
assertContains("scripts/yishun-production-smoke.mjs", "[\"/status\", \"YiShun Status\"]");

for (const deployNeedle of [
  "YISHUN_RELEASE_SHA: ${{ github.sha }}",
  "YISHUN_RELEASE_SHA=\"$YISHUN_RELEASE_SHA\"",
  "YISHUN_ANALYTICS_FILE: \"/home/yishun/logs/yishun-analytics.jsonl\"",
  "YISHUN_ANALYTICS_FILE=\"$YISHUN_ANALYTICS_FILE\"",
  "printf \"%s\\n\" \"$YISHUN_RELEASE_SHA\" > .yishun-release-sha",
  "mkdir -p \"$(dirname \"$YISHUN_ANALYTICS_FILE\")\"",
  "npx prisma migrate deploy",
  "pm2 restart yishun-nextjs --update-env",
  "health version ${r.version} did not match ${process.env.YISHUN_RELEASE_SHA}",
  "Verify public production health version",
  "public health version ${r.version} did not match ${process.env.YISHUN_RELEASE_SHA}",
  "sudo -n -u yishun pm2 describe yishun-nextjs",
  "Verify production analytics file sink locally",
  "ops_analytics_file_sink_probe",
  "analytics file sink verified",
  "Smoke share landing API locally",
  "Smoke Bazi preview access boundary locally",
]) {
  assertContains(".github/workflows/nextjs_ci.yml", deployNeedle);
}

assertContains("ecosystem.config.js", "YISHUN_ANALYTICS_FILE: '/home/yishun/logs/yishun-analytics.jsonl'");

for (const webhookNeedle of [
  "Stripe webhook verification failed",
  "Stripe webhook fulfillment failed",
  "checkout.session.completed",
  "fulfillCheckoutSession",
  "recordServerAnalyticsEvent",
]) {
  assertContains("app/api/stripe/webhook/route.ts", webhookNeedle);
}

for (const serverAnalyticsNeedle of [
  "yishun_server_analytics",
  "yishun_server_analytics_event",
  "checkout_completed",
  "entitlement_granted",
  "webhook_failed",
  "server_analytics_file_sink_failed",
]) {
  assertContains("lib/server-analytics.ts", serverAnalyticsNeedle);
}

for (const reportNeedle of [
  "yishun_analytics_event",
  "yishun_server_analytics_event",
  "route_status.json",
  "Core route check failed",
  "webhook_failed",
  "stripe_webhook_failures.csv",
  "Stripe webhook DB summary unavailable",
  "Stripe webhook failure rows found",
]) {
  assertContains("scripts/yishun-daily-data-report.mjs", reportNeedle);
}

for (const productionSmokeNeedle of [
  "YISHUN_PRODUCTION_SMOKE_OUT",
  "YISHUN_PRODUCTION_SMOKE_LABEL",
  "YISHUN_PRODUCTION_ANALYTICS_PROBE",
  "--json-out=",
  "--label=",
  "--analytics-probe",
  "reports/evidence",
  "yishun-production-smoke-",
  "writeJsonOut",
  "ops_health_ping",
  "/api/events",
  "accepted === 1",
  "analyticsIngest",
]) {
  assertContains("scripts/yishun-production-smoke.mjs", productionSmokeNeedle);
}

for (const packageNeedle of [
  "\"ops:analytics-probe\"",
  "yishun-analytics-pipeline-probe.mjs",
]) {
  assertContains("package.json", packageNeedle);
}

for (const analyticsProbeNeedle of [
  "ops_analytics_probe",
  "/api/events",
  "accepted !== 1",
  "gcloud",
  "logging",
  "probe_id",
  "cloudLogging",
  "Analytics ingest accepted the probe, but Cloud Logging did not expose the probe event before the timeout.",
]) {
  assertContains("scripts/yishun-analytics-pipeline-probe.mjs", analyticsProbeNeedle);
}

for (const errorNeedle of [
  "redactErrorMessage",
  "redactErrorMetadata",
  "[redacted-email]",
  "[redacted-token]",
  "[redacted-date]",
  "[redacted-number]",
  "[YiShunSafeError]",
  "SENTRY_DSN",
]) {
  assertContains("lib/error-logging.ts", errorNeedle);
}

assertMatches("lib/error-logging.ts", /email\|phone\|token\|secret\|password\|birth\|question\|name\|address\|cookie\|authorization\|ip\|session/i, "sensitive metadata key denylist");
assertContains("app/api/errors/route.ts", "buildSafeErrorLog");
assertContains("app/api/errors/route.ts", "traceId");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "health_endpoint_exposes_safe_release_status",
        "public_status_page_reuses_safe_health_snapshot",
        "deploy_workflow_verifies_local_health_and_core_smokes",
        "deploy_workflow_verifies_local_analytics_file_sink",
        "stripe_webhook_failures_are_visible_to_logs_and_daily_report",
        "stripe_webhook_success_and_failure_emit_server_analytics_events",
        "production_smoke_writes_durable_json_evidence",
        "production_smoke_can_probe_analytics_ingest",
        "analytics_pipeline_probe_checks_cloud_logging_visibility",
        "safe_error_adapter_redacts_sensitive_user_and_secret_fields",
      ],
    },
    null,
    2,
  ),
);
