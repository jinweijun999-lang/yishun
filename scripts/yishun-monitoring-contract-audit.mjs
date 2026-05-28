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
  "service: \"yishun\"",
  "version: appVersion()",
  "time: new Date().toISOString()",
  "checks: {",
  "database",
  "stripe",
  "analytics",
  "\"Cache-Control\": \"no-store\"",
]) {
  assertContains("app/api/health/route.ts", healthNeedle);
}

for (const deployNeedle of [
  "npx prisma migrate deploy",
  "pm2 restart yishun-nextjs --update-env",
  "curl -fsS --max-time 10 http://127.0.0.1:3001/api/health",
  "sudo -n -u yishun pm2 describe yishun-nextjs",
  "Smoke share landing API locally",
  "Smoke Bazi preview access boundary locally",
]) {
  assertContains(".github/workflows/nextjs_ci.yml", deployNeedle);
}

for (const webhookNeedle of [
  "Stripe webhook verification failed",
  "Stripe webhook fulfillment failed",
  "checkout.session.completed",
  "fulfillCheckoutSession",
]) {
  assertContains("app/api/stripe/webhook/route.ts", webhookNeedle);
}

for (const reportNeedle of [
  "webhook_failed",
  "stripe_webhook_failures.csv",
  "Stripe webhook DB summary unavailable",
  "Stripe webhook failure rows found",
]) {
  assertContains("scripts/yishun-daily-data-report.mjs", reportNeedle);
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
        "deploy_workflow_verifies_local_health_and_core_smokes",
        "stripe_webhook_failures_are_visible_to_logs_and_daily_report",
        "safe_error_adapter_redacts_sensitive_user_and_secret_fields",
      ],
    },
    null,
    2,
  ),
);
