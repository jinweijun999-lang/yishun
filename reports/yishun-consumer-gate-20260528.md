# YiShun Consumer Gate Report - 2026-05-28

## Scope

This pass keeps the matrix plan YiShun-first: no second product work starts until YiShun has a repeatable consumer-grade release gate, a health endpoint, and evidence-backed browser validation.

## Product Fixes

- Added `/api/health` for uptime checks covering app, database, Stripe, and analytics configuration.
- Added a reusable button/link audit gate for core public routes across desktop and mobile.
- Removed internal-feeling public copy such as QA/mock/V1 language from AI question surfaces.
- Improved logged-out auth handling so expected auth states do not create 401 console noise.
- Kept true solar time visible in the free teaser API for calculation transparency while deep report modules remain locked.
- Fixed English localization leakage on the home/tools surfaces and updated locale smoke coverage to the current Full Report positioning.
- Updated checkout and payment entitlement smoke tests to reflect the current sandbox-pending local behavior and separate Ask Credit vs Full Report entitlements.

## Verification Evidence

- `npm run lint` passed.
- `npm run build` passed. Remaining warning: Next.js middleware file convention is deprecated and should be migrated to `proxy` in a later cleanup.
- `/api/health` returned HTTP 200 locally with database/Stripe/analytics marked `not_configured` in dev.
- `npm run audit:buttons` passed: 29 routes, 2 viewports, 390 interactive elements, 60 safe clicks, 4 guarded payment/destructive/external actions, 0 failures.
- `npm run qa:regression` passed: 16/16 browser regression cases.
- Smoke gates passed: foundation, P0 new user, i18n language, i18n UX, English no-Chinese leakage, payment entitlement P0/P0B, P1 growth, wrong-second-60, Gemini hybrid, V3 gaps, D3 gaps, Fortune V1 S5, Sprint3.
- `npm run smoke:stripe-webhook` safely skipped because local `DATABASE_URL` is not configured; no Stripe live call or secret read was attempted.

## Latest Evidence Files

- `reports/evidence/yishun-core-button-audit-1779900624484.json`
- `/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-qa-regression-gate-fix-20260514/qa-regression-summary.json`

## Remaining Before Production

- Configure production/staging `DATABASE_URL`, Stripe keys, Stripe webhook secret, analytics sink, Sentry DSN, and uptime alert destinations.
- Run the Stripe webhook entitlement smoke against a local/staging database.
- Run a real Stripe test-mode checkout from the logged-in automation Chrome profile and verify webhook fulfillment.
- Migrate deprecated `middleware.ts` to the Next.js `proxy` convention.
- Deploy to staging, then run the same full gate against the staging URL before any public launch.
