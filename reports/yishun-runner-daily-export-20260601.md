# YiShun Runner Daily Export - 2026-06-01

## Conclusion

Added a non-interactive self-hosted runner path for the YiShun daily data loop. The workflow reads the production analytics file sink on the GCP runner, builds the daily operations package, writes a local workflow outbox copy, and uploads the non-secret report artifacts to GitHub Actions.

## Scope

- Avoids Mac-side interactive SSH for `/home/yishun/logs/yishun-analytics.jsonl`.
- Keeps Stripe live actions, production database writes, PM2 restarts, destructive operations, force push, and user-data deletion out of the daily report workflow.
- Runs at 09:30 Asia/Shanghai via GitHub Actions cron and can be manually dispatched with a specific report date.

## Verification Plan

- `node --check scripts/yishun-export-production-analytics-file.mjs`
- `node --check scripts/yishun-analytics-contract-audit.mjs`
- `npm run audit:analytics-contract`
- Local no-sudo synthetic export with `YISHUN_PRODUCTION_ANALYTICS_FILE_LOCAL=1`

## Remaining Risk

The new workflow must be merged to `main` and run on the `yishun-prod` self-hosted runner before it can prove runner-side access to the live analytics file. If the runner cannot `sudo -n -u yishun cat` the sink file, the artifact will fail loudly instead of silently falling back to Cloud Logging.
