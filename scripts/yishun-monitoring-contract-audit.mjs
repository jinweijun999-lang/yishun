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
  "googleOAuth: YiShunCheckStatus",
  "getGoogleOAuthReadiness",
  "process.env.NEXT_PUBLIC_YISHUN_ANALYTICS_ENDPOINT",
  "process.env.YISHUN_ANALYTICS_FILE",
  "process.env.YISHUN_ANALYTICS_FILES",
  "process.env.YISHUN_ANALYTICS_DIR",
  "databaseOk && stripeOk && googleOAuthOk && analyticsOk",
  "checks: {",
  "database",
  "stripe",
  "googleOAuth",
  "analytics",
  "integrations",
  "redirectMatches",
]) {
  assertContains("lib/yishun-health.ts", sharedHealthNeedle);
}

for (const statusPageNeedle of [
  "YiShun Status",
  "Public Status",
  "getYiShunHealthSnapshot",
  "Google OAuth",
  "health.integrations.googleOAuth.expectedRedirectUri",
  "no secrets, database URLs, user data, payment details, or private analytics rows",
]) {
  assertContains("app/status/page.tsx", statusPageNeedle);
}

for (const googleOAuthHealthNeedle of [
  "GOOGLE_OAUTH_CALLBACK_PATH",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_OAUTH_REDIRECT_URI",
  "YISHUN_GOOGLE_OAUTH_REQUIRED",
  "expectedGoogleOAuthRedirectUri",
]) {
  assertContains("lib/google-oauth-readiness.ts", googleOAuthHealthNeedle);
}

assertContains("app/sitemap.ts", "\"/status\"");
assertContains("scripts/yishun-production-smoke.mjs", "[\"/status\", \"YiShun Status\"]");

for (const routePatrolNeedle of [
  "[\"/tools\", \"YiShun\"]",
  "[\"/daily-timing\", \"Love Signal\"]",
  "[\"/reports\", \"YiShun\"]",
  "[\"/ask-master\", \"AI Master\"]",
  "[\"/ai-question\", \"Ask one focused life question\"]",
]) {
  assertContains("scripts/yishun-production-smoke.mjs", routePatrolNeedle);
  assertContains("scripts/yishun-daily-data-report.mjs", routePatrolNeedle);
}

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
  "Daily data report dry run",
  "YISHUN_REPORT_NO_NETWORK=1",
  "yishun-daily-data-report.mjs",
  "Smoke share landing API locally",
  "Smoke Bazi preview access boundary locally",
]) {
  assertContains(".github/workflows/nextjs_ci.yml", deployNeedle);
}

for (const runnerWatchdogNeedle of [
  "YiShun Runner Availability Watchdog",
  "runs-on: ubuntu-latest",
  "REQUIRED_RUNNER_LABELS: self-hosted,Linux,X64,yishun-prod",
  "MAX_QUEUED_MINUTES: \"10\"",
  "WAITING_RUN_STATUSES: queued,pending,waiting,requested",
  "WATCHED_WORKFLOWS: Next.js CI/CD,YiShun Daily Ops Export",
  "actions/github-script@v8.0.0",
  "listWorkflowRunsForRepo",
  "waitingStatuses",
  "GITHUB_TOKEN does not grant runner administration read",
  "no watched workflow has waited past the threshold",
  "waiting longer than",
]) {
  assertContains(".github/workflows/yishun_runner_watchdog.yml", runnerWatchdogNeedle);
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
  "YISHUN_PRODUCTION_SMOKE_REQUIRE_GOOGLE_OAUTH",
  "--json-out=",
  "--label=",
  "--analytics-probe",
  "--require-google-oauth",
  "reports/evidence",
  "yishun-production-smoke-",
  "writeJsonOut",
  "Production Google OAuth health must be configured",
  "Production Google OAuth must be marked required",
  "Production Google OAuth redirect URI must match the public base URL",
  "Production Google OAuth expected redirect URI must use the public base URL",
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
  "\"ops:runner-diagnostic\"",
  "yishun-runner-recovery-diagnostic.mjs",
]) {
  assertContains("package.json", packageNeedle);
}

for (const runnerDiagnosticNeedle of [
  "yishun-runner-recovery-diagnostic/1.0",
  "yishun-prod-runner",
  "WAITING_RUN_STATUSES",
  "queued\", \"pending\", \"waiting\", \"requested",
  "actions/runs?status=${status}",
  "gh\", [\n    \"run\"",
  "mergeQueuedRuns",
  "maxQueuedMinutes",
  "staleQueuedRuns",
  "releaseLag",
  "queued_main=",
  "actions/runners",
  "gcloud",
  "compute",
  "disks",
  "get-serial-port-output",
  "No space left on device",
  "actions-runner/_diag",
  "Serial disk exhaustion",
  "opsAgentBillingDisabled",
  "Cloud Ops metrics export",
  "billing-disabled failure detected",
  "ssh",
  "gcloudBillingDisabled",
  "--tunnel-through-iap",
  "IAP SSH check",
  "--troubleshoot",
  "safeRecoveryPlan",
  "Increase boot disk capacity",
  "Grow filesystem after disk resize",
  "Restart GitHub runner service after disk pressure is cleared",
  "Do not restart production PM2 outside the established deployment or emergency rollback path",
  "CODEX_BRIDGE_OUTBOX",
  "YISHUN_OPS_REPORT_FALLBACK_DIR",
  "Runner recovery remains blocked",
]) {
  assertContains("scripts/yishun-runner-recovery-diagnostic.mjs", runnerDiagnosticNeedle);
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

for (const launchReadinessNeedle of [
  "daily data report dry run",
  "YISHUN_REPORT_NO_NETWORK",
  "yishun-launch-readiness-daily",
]) {
  assertContains("scripts/yishun-launch-readiness.mjs", launchReadinessNeedle);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "health_endpoint_exposes_safe_release_status",
        "health_endpoint_exposes_google_oauth_redirect_readiness",
        "public_status_page_reuses_safe_health_snapshot",
        "deploy_workflow_verifies_local_health_and_core_smokes",
        "production_and_daily_route_patrol_cover_retention_tools_and_ask_surfaces",
        "deploy_workflow_verifies_local_analytics_file_sink",
        "stripe_webhook_failures_are_visible_to_logs_and_daily_report",
        "stripe_webhook_success_and_failure_emit_server_analytics_events",
        "production_smoke_writes_durable_json_evidence",
        "production_smoke_can_probe_analytics_ingest",
        "analytics_pipeline_probe_checks_cloud_logging_visibility",
        "runner_watchdog_surfaces_offline_self_hosted_runner_and_stale_queues",
        "runner_recovery_diagnostic_writes_bridge_evidence_for_offline_runner",
        "runner_recovery_diagnostic_surfaces_release_lag",
        "ci_and_launch_readiness_dry_run_daily_report",
        "safe_error_adapter_redacts_sensitive_user_and_secret_fields",
      ],
    },
    null,
    2,
  ),
);
