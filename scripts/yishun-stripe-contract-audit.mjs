#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message, details = {}) => {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
};

const checkoutRoute = read("app/api/stripe/checkout/route.ts");
const webhookRoute = read("app/api/stripe/webhook/route.ts");
const entitlements = read("lib/stripe-entitlements.ts");
const fullReportEntitlement = read("lib/full-report-entitlement.ts");
const entitlementStatusRoute = read("app/api/entitlements/route.ts");
const sandboxAdapter = read("lib/stripe-sandbox-adapter.ts");
const webhookSmoke = read("scripts/stripe-webhook-entitlement-smoke.mjs");
const dailyReport = read("scripts/yishun-daily-data-report.mjs");
const prismaSchema = read("prisma/schema.prisma");
const envExample = read(".env.example");
const envLocalExample = read(".env.local.example");
const workflow = read(".github/workflows/nextjs_ci.yml");

const checkoutProducts = [
  ["report_single", "STRIPE_PRICE_REPORT_SINGLE", "payment", "full_report"],
  ["premium_monthly", "STRIPE_PRICE_PREMIUM_MONTHLY", "subscription", "membership"],
  ["premium_annual", "STRIPE_PRICE_PREMIUM_ANNUAL", "subscription", "membership"],
  ["consultation_single", "STRIPE_PRICE_CONSULTATION_SINGLE", "payment", "ask_credit"],
];

for (const [product, priceEnv, mode] of checkoutProducts) {
  assert(checkoutRoute.includes(product), "Checkout route must expose every paid product", { product });
  assert(checkoutRoute.includes(priceEnv), "Checkout route must bind product to a Stripe price env", { product, priceEnv });
  assert(checkoutRoute.includes(`mode: "${mode}"`), "Checkout product must use the expected Stripe mode", { product, mode });
  assert(entitlements.includes(`"${product}"`), "Webhook entitlement layer must recognize checkout product", { product });
  assert(envExample.includes(priceEnv), ".env.example must document every Stripe price env", { priceEnv });
  assert(envLocalExample.includes(priceEnv), ".env.local.example must document every Stripe price env", { priceEnv });
  assert(webhookSmoke.includes(product), "DB-backed webhook smoke must exercise every checkout product", { product });
}

assert(
  webhookSmoke.includes("Expected 4 fulfilled events plus 1 duplicate_session event"),
  "DB-backed webhook smoke must validate monthly, annual, ask-credit, full-report, and duplicate-session outcomes",
);

for (const required of [
  "payment_reconciliation.json",
  "webhookFulfilled",
  "webhookDuplicateSessions",
  "webhookHasCheckoutWithoutFulfillment",
  "Payment reconciliation",
]) {
  assert(dailyReport.includes(required), "Daily report must reconcile checkout analytics against Stripe webhook fulfillment", { required });
}

for (const forbidden of ["ai_question_credit", "fulfilled: true", "consultationCredits: { increment"]) {
  const creditsRoute = read("app/api/credits/route.ts");
  assert(!creditsRoute.includes(forbidden), "/api/credits must remain checkout-only and must not grant entitlements directly", { forbidden });
}

for (const required of [
  "YISHUN_STRIPE_MODE",
  "STRIPE_LIVE_CUTOVER_ACK",
  "I_UNDERSTAND_STRIPE_LIVE_CHARGES",
  "Live Stripe key is blocked while YISHUN_STRIPE_MODE=test.",
  "STRIPE_SECRET_KEY must be an explicit sk_test_* or sk_live_* key.",
]) {
  assert(checkoutRoute.includes(required), "Checkout route must keep Stripe live-charge safeguards", { required });
}

for (const required of [
  "stripeSandboxCheckoutAdapter.createCheckout",
  "checkout_sandbox_pending",
  "chargePerformed: false",
  "Stripe is not configured. Opening sandbox pending checkout",
  "success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product=${product}`",
  "cancel_url: `${siteUrl}/checkout/cancel?product=${product}`",
  "client_reference_id: userId",
  "metadata: {",
  "product,",
  "userId: userId ?? \"\"",
  "priceId,",
  "stripeMode,",
  "payment_intent_data:",
  "subscription_data:",
  "allow_promotion_codes: true",
]) {
  assert(checkoutRoute.includes(required), "Checkout route must preserve test-mode metadata and sandbox fallback contract", { required });
}

for (const required of [
  "signature = request.headers.get(\"stripe-signature\")",
  "STRIPE_WEBHOOK_SECRET",
  "secretKey.startsWith(\"sk_test_\")",
  "webhookSecret.startsWith(\"whsec_\")",
  "stripe.webhooks.constructEvent(payload, signature, config.webhookSecret)",
  "event.type === \"checkout.session.completed\"",
  "fulfillCheckoutSession",
  "const status = result.fulfilled ? 200 : 400",
  "Stripe webhook fulfillment failed",
]) {
  assert(webhookRoute.includes(required), "Webhook route must verify Stripe test signatures and delegate fulfillment", { required });
}

for (const required of [
  "session.client_reference_id || metadata.userId || null",
  "isCheckoutProduct(metadata.product)",
  "prisma.user.findUnique",
  "prisma.$transaction",
  "stripeWebhookEvent.findUnique",
  "checkoutSessionId: session.id, status: \"fulfilled\"",
  "status: \"duplicate_session\"",
  "status: \"fulfilled\"",
  "case \"report_single\":\n      return {};",
  "product === \"report_single\") return \"full_report\"",
  "product === \"premium_monthly\" || product === \"premium_annual\") return \"membership\"",
]) {
  assert(entitlements.includes(required), "Fulfillment layer must preserve idempotent webhook entitlement contract", { required });
}

for (const [product, , , entitlementKind] of checkoutProducts) {
  if (entitlementKind === "full_report") {
    assert(fullReportEntitlement.includes("product: \"report_single\", status: \"fulfilled\""), "Full Report access must be restored from fulfilled report_single webhook history", { product });
  }
}

for (const required of [
  "getFullReportEntitlementForUser(user.id, user.planTier)",
  "checkoutSessionReceived",
  "webhook_pending_or_fulfilled",
  "noSecretRead: true",
]) {
  assert(entitlementStatusRoute.includes(required), "Entitlement recovery endpoint must stay read-only and webhook-driven", { required });
}

for (const required of [
  "chargePerformed: false",
  "safety: \"no_secret_read_no_live_charge\"",
  "LIVE_CHARGE_NOT_ALLOWED_IN_V1_LOCAL_ADAPTER",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
]) {
  assert(sandboxAdapter.includes(required), "Sandbox checkout adapter must remain no-charge and explicit about required env", { required });
}

for (const required of [
  "model StripeWebhookEvent",
  "id                String   @id",
  "checkoutSessionId String?",
  "userId            String?",
  "product           String?",
  "@@index([checkoutSessionId])",
  "@@index([userId])",
]) {
  assert(prismaSchema.includes(required), "Prisma schema must preserve webhook event audit storage", { required });
}

for (const source of [envExample, envLocalExample]) {
  for (const required of [
    "YISHUN_STRIPE_MODE=\"test\"",
    "STRIPE_LIVE_CUTOVER_ACK=\"\"",
    "STRIPE_SECRET_KEY=\"sk_test_xxx\"",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\"pk_test_xxx\"",
    "STRIPE_WEBHOOK_SECRET=\"whsec_test_xxx\"",
  ]) {
    assert(source.includes(required), "Example env files must keep Stripe test-mode placeholders", { required });
  }
}

assert(workflow.includes("npm run audit:stripe-contract"), "CI must run the Stripe payment contract audit");

console.log(JSON.stringify({
  ok: true,
  products: checkoutProducts.map(([product, priceEnv, mode, entitlementKind]) => ({
    product,
    priceEnv,
    mode,
    entitlementKind,
  })),
  checks: [
    "checkout_price_envs",
    "test_mode_live_safeguards",
    "sandbox_no_charge_fallback",
    "checkout_metadata",
    "webhook_signature_verification",
    "idempotent_fulfillment",
    "full_report_recovery",
    "read_only_entitlement_status",
    "webhook_event_storage",
    "db_backed_smoke_all_products",
    "daily_payment_reconciliation",
    "ci_gate_registered",
  ],
}, null, 2));
