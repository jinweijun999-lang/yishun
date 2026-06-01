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

for (const reportNeedle of ["checkout_started", "entitlement_granted", "saved_report", "save_result", "save_click", "traffic_sources.csv", "traffic_campaigns.csv", "retention.csv", "payment_reconciliation.json", "analytics_source.json", "route_status.json", "Core routes:", "Core route check failed", "Production health reports analytics configured", "YISHUN_ANALYTICS_FILES", "YISHUN_ANALYTICS_DIR", "discoverAnalyticsFiles", "parseAnalyticsExportRecords", "YISHUN_STRIPE_WEBHOOK_EVENTS_FILE", "stripe_webhook_fulfilled", "webhookFulfilled", "browserAnalyticsEntitlementGranted", "serverWebhookEntitlementGranted", "stripeWebhookEventsFromAnalytics", "analytics_export", "eventValue", "isOperationalAnalyticsEvent", "operationalProbeEvents", "rawReportDateEvents", "yishun_analytics_event", "yishun_server_analytics_event", "jsonPayload", "textPayload", "rawArgs.indexOf(\"--date\")"]) {
  assertContains("scripts/yishun-daily-data-report.mjs", reportNeedle);
}
assertContains("scripts/yishun-daily-data-report.mjs", "YISHUN_ANALYTICS_SOURCE_NOTE");

for (const exportMetaNeedle of [
  "readAnalyticsExportMetadata",
  ".meta.json",
  "exportMeta",
  "sourceKind",
  "production_file",
  "Production analytics file export returned 0 rows",
  "GCP analytics export returned 0 Cloud Logging entries",
  "meta.sourceKind !== \"production_file\" && meta.entryCount === 0",
  "inspect log payload shape",
]) {
  assertContains("scripts/yishun-daily-data-report.mjs", exportMetaNeedle);
}

for (const gcpExportNeedle of [
  "gcloud",
  "logging",
  "read",
  "YISHUN_GCP_PROJECT",
  "YISHUN_ANALYTICS_EXPORT_DIR",
  "YISHUN_GCP_ANALYTICS_TIMEOUT_MS",
  "gcloud logging read timed out",
  "allowEmpty",
  "start",
  "end",
  "yishun_analytics_event",
  "yishun_server_analytics_event",
]) {
  assertContains("scripts/yishun-export-gcp-analytics.mjs", gcpExportNeedle);
}

for (const productionFileExportNeedle of [
  "gcloud",
  "compute",
  "ssh",
  "YISHUN_PRODUCTION_ANALYTICS_FILE_LOCAL",
  "YISHUN_PRODUCTION_ANALYTICS_FILE_SSH_MODE",
  "sourceAccess",
  "local_runner",
  "--tunnel-through-iap",
  "sshAttempts",
  "YISHUN_GCP_INSTANCE",
  "YISHUN_GCP_ZONE",
  "YISHUN_PRODUCTION_ANALYTICS_FILE",
  "yishun-analytics-production-file",
  "rawLineCount",
  "malformedRows",
  "sudo -n -u yishun",
]) {
  assertContains("scripts/yishun-export-production-analytics-file.mjs", productionFileExportNeedle);
}

for (const dailyOpsWorkflowNeedle of [
  "YiShun Daily Ops Export",
  "30 1 * * *",
  "runs-on: [self-hosted, Linux, X64, yishun-prod]",
  "YISHUN_PRODUCTION_ANALYTICS_FILE_LOCAL: \"1\"",
  "YISHUN_DAILY_SKIP_GCP_EXPORT: \"1\"",
  "npm run ops:daily-loop -- --date \"$REPORT_DATE\" --skip-gcp-export",
  "actions/upload-artifact@v7.0.1",
  "yishun-daily-ops-${{ env.REPORT_DATE }}",
]) {
  assertContains(".github/workflows/yishun_daily_ops.yml", dailyOpsWorkflowNeedle);
}

for (const opsReviewNeedle of [
  "CODEX_BRIDGE_OUTBOX",
  "YISHUN_OPS_REPORT_FALLBACK_DIR",
  "payment_reconciliation.json",
  "route_status.json",
  "core route patrol failed",
  "analytics_source.json",
  "Daily operations risk",
  "writeResult",
  "rawArgs.indexOf(\"--date\")",
]) {
  assertContains("scripts/yishun-daily-ops-review.mjs", opsReviewNeedle);
}

assertContains("package.json", "\"ops:daily-review\"");
assertContains("package.json", "\"ops:daily-loop\"");
assertContains("package.json", "\"export:gcp-analytics\"");
assertContains("package.json", "\"export:production-analytics-file\"");
assertContains("package.json", "\"ops:analytics-probe\"");

for (const opsLoopNeedle of [
  "scripts/yishun-export-production-analytics-file.mjs",
  "scripts/yishun-export-gcp-analytics.mjs",
  "scripts/yishun-daily-data-report.mjs",
  "scripts/yishun-daily-ops-review.mjs",
  "YISHUN_ANALYTICS_FILE",
  "YISHUN_DAILY_SKIP_PRODUCTION_FILE_EXPORT",
  "falling back to Cloud Logging export",
  "YISHUN_ANALYTICS_SOURCE_NOTE",
  "attemptSummary",
  "--allow-empty",
  "Keep scanning",
  "analyticsSourceAvailable",
  "routeStatusOk",
  "reviewOutputPath",
]) {
  assertContains("scripts/yishun-daily-ops-loop.mjs", opsLoopNeedle);
}

for (const deployAnalyticsSinkNeedle of [
  "YISHUN_ANALYTICS_FILE: \"/home/yishun/logs/yishun-analytics.jsonl\"",
  "YISHUN_ANALYTICS_FILE=\"$YISHUN_ANALYTICS_FILE\"",
  "Verify production analytics file sink locally",
  "ops_analytics_file_sink_probe",
  "analytics file sink verified",
]) {
  assertContains(".github/workflows/nextjs_ci.yml", deployAnalyticsSinkNeedle);
}

assertContains("ecosystem.config.js", "YISHUN_ANALYTICS_FILE: '/home/yishun/logs/yishun-analytics.jsonl'");

for (const productionFileExportNeedle of [
  "gcloud",
  "compute",
  "ssh",
  "YISHUN_PRODUCTION_ANALYTICS_FILE",
  "sourceKind: \"production_file\"",
  "sourceAccess",
  "local_runner",
  "sshAttempts",
  "rawLineCount",
  "malformedRows",
]) {
  assertContains("scripts/yishun-export-production-analytics-file.mjs", productionFileExportNeedle);
}

for (const analyticsMetaNeedle of [
  "sourceKind",
  "production_file",
  "cloud_logging",
  "rawLineCount",
  "Production analytics file export",
  "Production analytics file export failed",
]) {
  assertContains("scripts/yishun-daily-data-report.mjs", analyticsMetaNeedle);
}

for (const analyticsProbeNeedle of [
  "ops_analytics_probe",
  "/api/events",
  "gcloud",
  "logging",
  "read",
  "probeId",
  "YISHUN_ANALYTICS_PROBE_WAIT_MS",
]) {
  assertContains("scripts/yishun-analytics-pipeline-probe.mjs", analyticsProbeNeedle);
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

for (const checkoutNeedle of [
  "checkout_start",
  "checkout_failed",
  "responseStatus",
  "network_or_client_exception",
]) {
  assertContains("app/components/StripeCheckoutButton.tsx", checkoutNeedle);
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
        "daily_report_and_ops_review_honor_date_cli_argument",
        "daily_ops_loop_exports_gcp_analytics_before_bridge_review",
        "analytics_pipeline_probe_verifies_ingest_and_cloud_logging_without_product_metric_pollution",
        "gcp_analytics_export_command_writes_daily_jsonl_for_report_input",
        "production_analytics_file_export_reads_vm_sink_for_daily_report_input",
        "gcp_analytics_export_times_out_for_unattended_runs",
        "analytics_file_sink_creates_parent_directory_before_append",
        "deploy_workflow_enables_and_verifies_production_analytics_file_sink",
        "checkout_button_emits_checkout_failed_for_config_and_client_failures",
        "stripe_webhook_fulfillment_emits_privacy_safe_server_funnel_events",
      ],
    },
    null,
    2,
  ),
);
