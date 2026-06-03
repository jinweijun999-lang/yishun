# YiShun Daily Data Loop - 2026-05-28

## Scope

This adds a local daily data package generator for the YiShun 24h monitoring and data-analysis loop. It is designed to run safely in unattended mode and never calls Stripe live APIs, mutates database rows, or exports raw user identifiers.

## Command

```bash
npm run report:yishun-daily
```

If production events are only available through Google Cloud Logging, export them first:

```bash
REPORT_DATE=YYYY-MM-DD npm run export:gcp-analytics -- --allow-empty
YISHUN_ANALYTICS_FILE=output/yishun-analytics/yishun-analytics-gcp-YYYY-MM-DD.jsonl npm run report:yishun-daily
```

Useful environment:

- `REPORT_DATE=YYYY-MM-DD` selects the Asia/Shanghai report day.
- `YISHUN_GCP_PROJECT=bazifortune` selects the Cloud Logging project for `npm run export:gcp-analytics`.
- `YISHUN_ANALYTICS_EXPORT_DIR=output/yishun-analytics` changes the GCP analytics export output directory.
- `YISHUN_ANALYTICS_FILE=/home/yishun/data/analytics-events.jsonl` reads the production file sink.
- `YISHUN_STRIPE_WEBHOOK_EVENTS_FILE=/home/yishun/data/stripe-webhook-events.jsonl` reads a JSONL export of webhook rows when direct `DATABASE_URL` access is unavailable.
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
  deployment_status.json
  errors.jsonl
  stripe_payments.csv
  stripe_webhook_failures.csv
  payment_reconciliation.json
  payment_reconciliation.csv
  funnel.csv
  retention.csv
  traffic_sources.csv
  traffic_campaigns.csv
  growth_scorecard.json
  growth_scorecard.csv
  top_pages.csv
  anomaly_notes.md
  analyst_questions.md
```

## Coverage

- `/api/health` uptime status and latency.
- Deployment status from GitHub Actions and public health, including release lag and stale deploy queue risk when available.
- Analytics funnel counts using the canonical 14-day plan event names with aliases for current YiShun events.
- Google Cloud Logging exports containing `yishun_analytics_event` or `yishun_server_analytics_event` can be converted into the daily report input JSONL.
- Retention proxy counts from daily-card and return-visit events.
- Traffic source, UTM campaign, and top-page aggregates from nested `properties` or top-level event exports without exposing raw visitor IDs.
- Growth scorecard thresholds for activation, retention, sharing, paid conversion, and Stripe entitlement fulfillment.
- Read-only Stripe webhook fulfillment counts when `DATABASE_URL` is configured.
- File-export fallback for Stripe webhook rows when `DATABASE_URL` is unavailable, so `entitlement_granted` and `webhook_failed` still appear in the daily funnel.
- Payment reconciliation risk from checkout analytics versus fulfilled, duplicate, and failed Stripe webhook rows.
- Failure rows from analytics and webhook records.

## Current Limits

- Frontend p95 and JS error rate still need Sentry/PostHog/GA4 or another external telemetry source.
- Checkout revenue amount is not pulled from Stripe in this script; it reports webhook fulfillment counts only.
- If the analytics file sink is absent, the package is still generated with a clear anomaly note.
