import { readFileSync, existsSync } from "node:fs";

const checks = [
  ["Product positioning", "lib/platform-foundation.ts", ["YiShun — Daily Eastern Timing & AI Fortune Companion"]],
  ["Entitlement status API", "app/api/entitlements/route.ts", ["webhook_pending_or_fulfilled", "noSecretRead", "idempotent"]],
  ["Checkout recovery client", "app/components/CheckoutEntitlementRecovery.tsx", ["Entitlement recovery", "yishun:checkoutRecovery", "/api/entitlements"]],
  ["Checkout success recovery mount", "app/checkout/success/page.tsx", ["CheckoutEntitlementRecovery"]],
  ["Report quality gate", "lib/report-quality-gate.ts", ["emotional_value", "action_advice", "explanation_basis", "save_cta", "share_cta", "Gemini may enhance high-value personalization only"]],
  ["Ritual API", "app/api/ritual/route.ts", ["Three-coin reflection", "Daily draw", "paidExecution: false", "evaluateReportQuality"]],
  ["Ritual page", "app/ritual/page.tsx", ["Eastern Ritual", "Copper coins", "Quality", "AI used"]],
  ["Tools ritual entry", "app/tools/page.tsx", ["/ritual", "Open daily ritual", "ritualView"]],
  ["Crash adapter message redaction", "lib/error-logging.ts", ["redactErrorMessage", "redacted-email", "redacted-token", "redacted-date"]],
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
  console.error("fortune-v1-s5-consumer-grade-smoke failed:\n" + failures.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checks: checks.length, gate: "fortune-v1-s5-consumer-grade-hardening" }, null, 2));
