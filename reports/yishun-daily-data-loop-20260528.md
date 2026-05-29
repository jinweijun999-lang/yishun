# YiShun Daily Data Loop - 2026-05-28

## Scope

This adds a local daily data package generator for the YiShun 24h monitoring and data-analysis loop. It is designed to run safely in unattended mode and never calls Stripe live APIs, mutates database rows, or exports raw user identifiers.

## Command

```bash
npm run report:yishun-daily
```

Useful environment:

- `REPORT_DATE=YYYY-MM-DD` selects the Asia/Shanghai report day.
- `YISHUN_ANALYTICS_FILE=/home/yishun/data/analytics-events.jsonl` reads the production file sink.
- `YISHUN_HEALTH_URL=https://11263.com/api/health` overrides the health endpoint.
- `YISHUN_DAILY_REPORT_DIR=reports/daily` changes the output root.
- `YISHUN_REPORT_NO_NETWORK=1` skips the health probe for local smoke runs.

## Output

The command writes:

```text
reports/daily/yishun-daily-YYYY-MM-DD/
  summary.md
  uptime.json
  performance.json
  errors.jsonl
  stripe_payments.csv
  stripe_webhook_failures.csv
  funnel.csv
  retention.csv
  traffic_sources.csv
  traffic_campaigns.csv
  top_pages.csv
  anomaly_notes.md
  analyst_questions.md
```

## Coverage

- `/api/health` uptime status and latency.
- Analytics funnel counts using the canonical 14-day plan event names with aliases for current YiShun events.
- Retention proxy counts from daily-card and return-visit events.
- Traffic source, UTM campaign, and top-page aggregates from nested `properties` or top-level event exports without exposing raw visitor IDs.
- Read-only Stripe webhook fulfillment counts when `DATABASE_URL` is configured.
- Failure rows from analytics and webhook records.

## Current Limits

- Frontend p95 and JS error rate still need Sentry/PostHog/GA4 or another external telemetry source.
- Checkout revenue amount is not pulled from Stripe in this script; it reports webhook fulfillment counts only.
- If the analytics file sink is absent, the package is still generated with a clear anomaly note.
