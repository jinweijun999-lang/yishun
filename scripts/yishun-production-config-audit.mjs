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

const requiredEnvNames = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_REPORT_SINGLE",
  "STRIPE_PRICE_PREMIUM_MONTHLY",
  "STRIPE_PRICE_PREMIUM_ANNUAL",
  "STRIPE_PRICE_CONSULTATION_SINGLE",
  "NEXT_PUBLIC_YISHUN_ANALYTICS_ENDPOINT",
  "YISHUN_ANALYTICS_FILE",
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_ENVIRONMENT",
];

for (const envFile of [".env.example", ".env.local.example"]) {
  for (const envName of requiredEnvNames) {
    assertContains(envFile, envName);
  }
}

assertContains("lib/public-url.ts", "process.env.NEXT_PUBLIC_APP_URL");
assertContains("lib/public-url.ts", "process.env.NEXT_PUBLIC_SITE_URL");
assertContains("app/api/v1/shares/route.ts", "getRequestBaseUrl");
assertContains("app/api/stripe/checkout/route.ts", "getRequestBaseUrl");
assertContains("app/api/credits/route.ts", "getRequestBaseUrl");
assertContains(".env.example", "https://11263.com/api/auth/callback/google");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "env_examples_cover_public_url_auth_stripe_analytics_sentry",
        "share_checkout_credit_urls_use_common_public_base_url",
        "google_oauth_redirect_uri_documented",
      ],
    },
    null,
    2,
  ),
);
