#!/usr/bin/env node
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const files = {
  preview: "app/api/bazi/preview/route.ts",
  result: "app/reading/result/page.tsx",
  reports: "app/reports/page.tsx",
  profile: "app/profile/page.tsx",
  stripe: "lib/stripe-entitlements.ts",
  adapter: "lib/full-report-entitlement.ts",
};
const src = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]));

// Anonymous/free preview must be a teaser, not a deep substitute.
assert.match(src.preview, /depth: "free_teaser"/, "preview API must emit free_teaser depth");
assert.match(src.preview, /lockedModules: \["four_pillars"/, "preview API must name locked deep modules");
assert.match(src.preview, /hasFullReport \?/, "preview API must gate deep chart payload behind full-report entitlement");
assert.doesNotMatch(src.preview, /report_single[\s\S]{0,160}consultationCredits: \{ increment: 1 \}/, "preview/API code must not imply report_single adds ask credits");

// Full Report entitlement is separate from ask credits.
assert.match(src.stripe, /case "report_single":\n\s+return \{\};/, "report_single fulfillment must not increment consultationCredits");
assert.match(src.adapter, /report_single_adapter/, "must expose clearly named Full Report adapter until schema migration");
assert.match(src.adapter, /Ask credits do not unlock the full report/, "adapter must document ask-credit/full-report split");

// Result/report/profile UI must show teaser, locks, unlock CTA, and unlocked state.
assert.match(src.result, /Free teaser/, "reading result must label teaser state");
assert.match(src.result, /Locked Full Report modules/, "reading result must show locked modules");
assert.match(src.result, /Buy Full Report \/ Unlock Full Report \(no ask credits used\)/, "reading result CTA must not mix ask credits with report unlock");
assert.match(src.result, /Full report unlocked/, "reading result must support unlocked state");
assert.match(src.reports, /Reports are split into Free teasers, Full Reports, and AI question records/, "reports page must split report categories");
assert.match(src.profile, /Full Report entitlement/, "profile must expose full-report entitlement status");

console.log(JSON.stringify({ ok: true, smoke: "payment-entitlement-p0b", checked: Object.values(files) }));
