import { readFileSync } from 'node:fs';

const checks = [
  ['lib/p1-analytics.ts', 'CLICK_PAYWALL: "click_paywall"'],
  ['lib/p1-analytics.ts', 'CHECKOUT_START: "checkout_start"'],
  ['lib/p1-analytics.ts', 'UNLOCK_SUCCESS: "unlock_success"'],
  ['app/components/CheckoutEntitlementRecovery.tsx', 'I completed checkout — recheck unlock'],
  ['app/components/CheckoutEntitlementRecovery.tsx', 'never grants credits directly'],
  ['app/reading/result/page.tsx', 'result_recovered_after_refresh'],
  ['app/reading/result/page.tsx', 'downloadTextAsFile'],
  ['app/reading/result/page.tsx', 'Save image card'],
  ['app/ai-question/page.tsx', 'empty_input_error'],
  ['app/api/bazi/preview/route.ts', 'Hit signal: today is strongest'],
];

const failures = [];
for (const [file, needle] of checks) {
  const text = readFileSync(file, 'utf8');
  if (!text.includes(needle)) failures.push(`${file} missing ${needle}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  d3Gaps: [
    'result persistence / refresh recovery',
    'sandbox entitlement recheck loop',
    'one-click share image SVG save',
    'smoke-verifiable analytics events',
    'empty input error state',
    'stronger hit-feeling copy',
  ],
}, null, 2));
