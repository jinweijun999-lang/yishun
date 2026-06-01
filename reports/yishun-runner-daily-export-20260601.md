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

The workflow must run on the `yishun-prod` self-hosted runner before it can prove runner-side access to the live analytics file. If the runner cannot `sudo -n -u yishun cat` the sink file, the artifact will fail loudly instead of silently falling back to Cloud Logging.

2026-06-01 follow-up: the first manual dispatch failed inside `actions/setup-node` before any package step emitted logs. The self-hosted deployment chain already uses runner-local `node` and `npm`, so the daily workflow now verifies the installed runner Node.js directly instead of invoking `actions/setup-node`.

2026-06-02 follow-up: the next blocker was runner disk exhaustion while writing GitHub runner diagnostic logs. The daily export workflow now avoids `actions/checkout` and `npm ci` entirely, runs the built-in Node scripts from `/home/yishun/yishun`, writes artifacts under `/tmp/yishun-daily-ops`, and prints a read-only disk snapshot before the report step. This keeps the daily ops package on the production runner path while reducing unattended disk pressure.

2026-06-02 watchdog follow-up: the production VM is running and public YiShun smoke passed, but GitHub reports the `yishun-prod-runner` self-hosted runner as offline and the `main` deploy queued after CI. Added a GitHub-hosted `YiShun Runner Availability Watchdog` workflow so runner offline/stale queued deploys fail visibly even when the self-hosted runner cannot pick up jobs.

2026-06-02 watchdog token follow-up: the first watchdog dispatch proved `GITHUB_TOKEN` cannot read the repository self-hosted runner list (`administration=read` required). The watchdog now avoids the runner-admin endpoint and uses the actions-read queue signal instead: if `Next.js CI/CD` or `YiShun Daily Ops Export` remains queued beyond the threshold, the GitHub-hosted watchdog fails visibly.
