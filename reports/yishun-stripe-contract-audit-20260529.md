# YiShun Stripe Contract Audit - 2026-05-29

## Conclusion

YiShun now has a no-network Stripe payment contract gate that checks checkout, webhook, entitlement restoration, Prisma webhook storage, DB-backed smoke coverage, env placeholders, and CI registration before any Stripe API call is attempted.

## Scope

- Keep checkout in Stripe test mode by default.
- Preserve the live-charge acknowledgement guard for future cutover.
- Verify the four paid product paths: Full Report, monthly membership, annual membership, and single consultation credit.
- Require the DB-backed webhook entitlement smoke to cover all four paid product paths plus duplicate checkout-session idempotency.
- Keep `/api/credits` checkout-only so payment fulfillment remains webhook-driven.
- Confirm Full Report access is recovered from fulfilled `report_single` webhook history until a dedicated entitlement table is migrated.

## Verification

Run:

```bash
npm run audit:stripe-contract
```

Expected result:

- `ok: true`
- Products covered:
  - `report_single`
  - `premium_monthly`
  - `premium_annual`
  - `consultation_single`
- Checks covered:
  - checkout price envs
  - test/live Stripe safeguards
  - no-charge sandbox fallback
  - checkout metadata
  - webhook signature verification
  - idempotent fulfillment
  - Full Report recovery
  - read-only entitlement status
  - webhook event storage
  - DB-backed smoke coverage for all products
  - CI gate registration

Additional local syntax gate:

```bash
node --check scripts/stripe-webhook-entitlement-smoke.mjs
```

## Remaining Risk

This gate is static and no-network by design. Stripe test-mode checkout plus signed webhook fulfillment still needs a reachable app, Stripe test keys, webhook secret, and `DATABASE_URL`.
