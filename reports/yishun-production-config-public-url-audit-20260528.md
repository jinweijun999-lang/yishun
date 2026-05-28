# YiShun Production Config Public URL Audit - 2026-05-28

## Conclusion

Closed a production configuration drift risk where share links used `NEXT_PUBLIC_APP_URL` while checkout, credits, SEO metadata, sitemap, and robots used `NEXT_PUBLIC_SITE_URL`.

YiShun now resolves both names through one helper, preferring `NEXT_PUBLIC_APP_URL`, falling back to `NEXT_PUBLIC_SITE_URL`, then to the request origin or `https://11263.com` where appropriate.

## Changed Files

- `lib/public-url.ts`
- `app/api/v1/shares/route.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/credits/route.ts`
- `app/layout.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `.env.example`
- `.env.local.example`
- `scripts/yishun-production-config-audit.mjs`
- `package.json`

## Verification

- `npm run audit:production-config` passed.
- `npm run lint` passed.
- `npx next build --webpack` passed and reported `Proxy (Middleware)`.
- `npm test` passed.
- `npm run smoke:p0-payment-entitlement` passed.
- `node scripts/stripe-sandbox-secret-check.mjs` passed.

The default `npm run build` still fails only in this local sandbox because Turbopack attempts to bind a worker port and receives `Operation not permitted`; the webpack build path succeeds.

## Risks

- GitHub API and git remote access failed with DNS errors for `github.com`, so PR/CI status and push could not be verified from this run.
- Stripe real test-mode checkout/webhook fulfillment still needs configured test secrets and a database-backed environment.
- Current branch contains daily data-loop files that were present during this run and were verified with `YISHUN_REPORT_NO_NETWORK=1 npm run report:yishun-daily`.

## Next Action

When network access is available, push this branch, open or update the PR against `main`, and let GitHub Actions validate the normal CI build/deploy path.
