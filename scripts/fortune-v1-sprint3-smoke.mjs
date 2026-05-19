import { readFileSync, existsSync } from "node:fs";

const checks = [
  ["AI question confirmation page", "app/ai-question/page.tsx", ["Ask with confirmation before any charge", "Mock paid execute", "Future live adapter"]],
  ["AI question route", "app/api/ai-question/route.ts", ["stripeSandboxCheckoutAdapter", "sandbox_checkout_ready_no_charge", "noDeductionGuarantee"]],
  ["Daily Timing page", "app/daily-timing/page.tsx", ["traceable daily timing", "Generate traceable daily timing"]],
  ["Relationship Lite page", "app/relationship-lite/page.tsx", ["Relationship Lite", "not persist"]],
  ["Feedback route", "app/api/support/feedback/route.ts", ["supportTicketStore", "support-ticket-persistence-v1"]],
  ["Support ticket adapter", "lib/support-ticket-store.ts", ["SupportTicketStore", "memory-local-v1", "dbSupportTicketStore"]],
  ["Sentry/crash adapter", "lib/error-logging.ts", ["captureCrashEvent", "SENTRY_DSN", "sent: false"]],
  ["Stripe sandbox adapter", "lib/stripe-sandbox-adapter.ts", ["no_secret_read_no_live_charge", "STRIPE_SECRET_KEY", "chargePerformed: false"]],
  ["S5 entitlement recovery", "app/api/entitlements/route.ts", ["webhook_pending_or_fulfilled", "noSecretRead", "idempotent"]],
  ["S5 report quality gate", "lib/report-quality-gate.ts", ["emotional_value", "action_advice", "explanation_basis", "save_cta", "share_cta"]],
  ["S5 ritual minimum", "app/api/ritual/route.ts", ["Three-coin reflection", "Daily draw", "paidExecution: false", "evaluateReportQuality"]],
  ["i18n language selector smoke", "scripts/i18n-language-switch-smoke.mjs", ["getByLabel(/Language|语言/)"]],
  ["i18n aria-label smoke", "scripts/i18n-ux-copy-smoke.mjs", ["getByLabel(item.backAria.zh)", "getByLabel(item.backAria.en)"]],
  ["Stripe dev DATABASE_URL handling", "scripts/stripe-webhook-entitlement-smoke.mjs", ["DATABASE_URL_NOT_CONFIGURED", "requiredEnv: [\"DATABASE_URL\"]"]],
];

const failures = [];
for (const [label, file, needles] of checks) {
  if (!existsSync(file)) {
    failures.push(`${label}: missing ${file}`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${label}: missing ${needle}`);
  }
}

if (failures.length) {
  console.error("fortune-v1-sprint3-smoke failed:\n" + failures.join("\n"));
  process.exit(1);
}

console.log(`fortune-v1-sprint3-smoke passed (${checks.length} checks)`);
