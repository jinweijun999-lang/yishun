import { readFileSync, existsSync } from "node:fs";

const checks = [
  ["daily page", "app/daily-timing/page.tsx", ["traceable daily timing", "Generate traceable daily timing"]],
  ["daily api", "app/api/daily-timing/route.ts", ["trace", "generateDailySignal"]],
  ["profile support", "app/profile/page.tsx", ["feedback-support", "Submit feedback", "Tracking ID", "support@yishun.app"]],
  ["support feedback api", "app/api/support/feedback/route.ts", ["normalizeSupportTicket", "supportTicketStore", "support-ticket-persistence-v1"]],
  ["support feedback lib", "lib/support-feedback.ts", ["order_payment", "YS-"]],
  ["support ticket store", "lib/support-ticket-store.ts", ["SupportTicketStore", "memory-local-v1", "dbSupportTicketStore", "emailPresent"]],
  ["relationship page", "app/relationship-lite/page.tsx", ["Relationship Lite", "not persist"]],
  ["relationship api", "app/api/relationship-lite/route.ts", ["persistsPartnerPrivateData", "computeRelationshipLite"]],
  ["ai question page", "app/ai-question/page.tsx", ["AI Master Question", "If execution fails, the reserved credit is returned", "Credit-safety contract verified"]],
  ["ai question api", "app/api/ai-question/route.ts", ["mockPaidQuestionAdapter", "stripeSandboxCheckoutAdapter", "noDeductionGuarantee", "chargePerformed: false"]],
  ["ai question adapter", "lib/ai-question-payment.ts", ["reserve-credit -> execute-reading -> capture-credit | release-reservation", "MOCK_EXECUTION_FAILURE_RELEASED_RESERVATION"]],
  ["stripe sandbox adapter", "lib/stripe-sandbox-adapter.ts", ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "chargePerformed: false", "LIVE_CHARGE_NOT_ALLOWED_IN_V1_LOCAL_ADAPTER"]],
  ["paywall abstraction", "lib/platform-foundation.ts", ["confirm_before_charge", "checkQuestionEntitlement"]],
  ["error logging adapter", "lib/error-logging.ts", ["No secrets", "redactErrorMetadata", "captureCrashEvent", "SENTRY_DSN"]],
  ["error logging api", "app/api/errors/route.ts", ["buildSafeErrorLog", "traceId"]],
  ["analytics dictionary", "lib/platform-foundation.ts", ["relationship_lite_submit", "daily_timing_submit", "feedback_submit", "ai_question_mock_paid_execute"]],
  ["navigation/tools entry", "app/components/Navigation.tsx", ["/tools", "grid-cols-4"]],
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
  console.error("consumer-v1-foundation-smoke failed:\n" + failures.join("\n"));
  process.exit(1);
}

console.log(`consumer-v1-foundation-smoke passed (${checks.length} coverage groups)`);
