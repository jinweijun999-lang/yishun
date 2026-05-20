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

const coverage = [
  ["home", "app/page.tsx", ["PaymentValueMatrix", "source=\"home\""]],
  ["reports", "app/reports/page.tsx", ["PaymentValueMatrix", "source=\"reports\""]],
  ["ai-question", "app/ai-question/page.tsx", ["Use 1 credit", "Ask with credit", "PaymentValueMatrix"]],
  ["payment-matrix", "app/components/PaymentValueMatrix.tsx", ["Buy one Ask Credit", "Use 1 credit", "Buy Full Report", "/membership", "/ai-question", "/reading/result"]],
  ["daily-timing", "app/daily-timing/page.tsx", ["Love Signal", "Money Window", "Career Warning", "PaymentValueMatrix", "source=\"daily_timing\""]],
  ["relationship-lite", "app/relationship-lite/page.tsx", ["PaymentValueMatrix", "source=\"relationship_lite\""]],
  ["profile", "app/profile/page.tsx", ["PaymentValueMatrix", "source=\"profile\""]],
  ["reading-result", "app/reading/result/page.tsx", ["PaymentValueMatrix", "source=\"reading_result\"", "Unlock Full Report"]],
  ["crush-reading", "app/crush-reading/page.tsx", ["Love Compatibility", "Crush Reading", "Ask AI Love", "PaymentValueMatrix"]],
  ["tarot-hub", "app/tarot/page.tsx", ["Tarot", "灵签", "铜钱卦", "PaymentValueMatrix"]],
];

for (const [name, file, needles] of coverage) {
  const source = read(file);
  for (const needle of needles) {
    assert(source.includes(needle), `Missing paid consumption entry on ${name}`, { file, needle });
  }
}

const home = read("app/page.tsx");
for (const needle of ["Unlock your full destiny report", "complete destiny preview", "love, career, money", "Ask AI master", "Love match", "Full destiny report", "3-minute strong experiences", "Tarot / Oracle / Coin", "$0.99-style deep report"]) {
  assert(home.includes(needle), "Home must expose full-report-led Love/Career/Money answer positioning", { needle });
}
for (const forbidden of ["Know today’s best timing", "Generate today’s action timing card", "60 秒生成今日行动时机卡", "Trusted Eastern timing rules · BaZi + Five Elements · Gemini explanation"]) {
  assert(!home.includes(forbidden), "Home hero must not regress to Daily Timing or vague concept-stack positioning", { forbidden });
}

const membership = read("app/membership/page.tsx");
for (const needle of ["View benefits first · purchase after sign-in", "View benefits", "Sign in to purchase", "Checkout is locked until you sign in", "checkout fulfillment"]) {
  assert(membership.includes(needle), "Logged-out membership UX must separate benefit viewing from purchasing", { needle });
}

for (const file of ["app/profile/page.tsx", "app/membership/page.tsx"]) {
  const source = read(file);
  assert(!source.includes('fetch("/api/credits"') && !source.includes("fetch('/api/credits'"), "Profile/membership must not call /api/credits directly", { file });
  assert(!source.includes("handleBuyCredit"), "Profile/membership must not keep direct buy-credit handler", { file });
}

const creditsRoute = read("app/api/credits/route.ts");
assert(!creditsRoute.includes("prisma.user.update"), "/api/credits must not directly mutate user credits");
assert(!creditsRoute.includes("consultationCredits: { increment") && !creditsRoute.includes("consultationCredits: update.credits + 1"), "/api/credits must not directly increment credits");
assert(creditsRoute.includes("checkout_sandbox_pending") && creditsRoute.includes("chargePerformed: false"), "/api/credits must return sandbox checkout pending metadata");
assert(creditsRoute.includes("pending_webhook_not_fulfilled") && !creditsRoute.includes("fulfilled: true"), "/api/credits must not fulfill credits; it can only return pending checkout metadata");

const checkoutRoute = read("app/api/stripe/checkout/route.ts");
assert(checkoutRoute.includes("stripeSandboxCheckoutAdapter") && checkoutRoute.includes("/checkout/sandbox?product="), "Stripe checkout must fall back to sandbox pending page when unconfigured");

const entitlement = read("lib/stripe-entitlements.ts");
assert(/case "report_single":\s*return \{\};/.test(entitlement), "report_single must not increment ask credits");
assert(entitlement.includes('product === "report_single") return "full_report"'), "report_single must map to Full Report entitlement");

const previewRoute = read("app/api/bazi/preview/route.ts");
const lockedPayload = previewRoute.slice(previewRoute.indexOf(': {\n      birthProfile'), previewRoute.indexOf('const allowGeminiMocks'));
for (const forbidden of ["fourPillars", "tenGodPattern", "interpretation:", "trueSolarTime", "elementsBalance", "dayMaster"]) {
  assert(!lockedPayload.includes(forbidden), "Anonymous/free teaser payload leaks full-report field", { forbidden });
}
assert(lockedPayload.includes("freeSummary") && lockedPayload.includes("lockedModules"), "Anonymous/free teaser must expose teaser + lockedModules only");

console.log(JSON.stringify({
  ok: true,
  coverage: coverage.map(([name]) => name),
  checks: ["home_love_career_money_positioning", "membership_logged_out_view_vs_purchase", "buy_click_no_credit_increment", "api_credits_no_fulfillment", "use_credit_entry_visible", "single_purchase_entry_visible", "sandbox_pending_checkout", "report_single_full_report", "anonymous_teaser_no_full_fields"],
}, null, 2));
