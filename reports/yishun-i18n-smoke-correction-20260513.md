# YiShun i18n Smoke Correction — 2026-05-13

## Conclusion
Corrected the repository mismatch found by main. The release repository `/Users/xiajarvan/.openclaw/workspace/yishun` already contains the localization fix in its ahead commits, but it was missing the reported i18n smoke script and package script. Those are now added locally; no push or deploy was performed.

## Ahead commits checked
`origin/main..HEAD` contains 5 commits:
1. `5c08e9e fix: preserve partial birth picker selections`
2. `bc5b551 fix: localize core acquisition flow` — includes home/start localization changes.
3. `f2fa079 fix: require login before checkout`
4. `3fc569f fix: quiet unauthenticated consultation fetches`
5. `e1b0265 fix: close product UX localization gaps` — includes additional product localization gap fixes.

## Changes made in correction
- `package.json`: added `smoke:i18n-language`.
- `scripts/i18n-language-switch-smoke.mjs`: added Playwright smoke for mobile homepage language switching.

## Verification
- `YISHUN_BASE_URL=http://localhost:3133 npm run smoke:i18n-language` → passed.
- `npm run lint` → passed.
- `npm run build` → passed.

## Release status
Pre-release gate is green for build/lint/i18n language switch smoke. Repository still has local uncommitted correction files plus pre-existing untracked report files. No push/deploy performed.

## Superpowers / skills usage proof
- Received skills/superpowers: using-superpowers, brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, using-git-worktrees, requesting-code-review, receiving-code-review, verification-before-completion, finishing-a-development-branch.
- Used: systematic-debugging, receiving-code-review, verification-before-completion, executing-plans.
- Evidence: inspected `origin/main..HEAD`, confirmed repository mismatch, added smoke script to actual release repo, ran smoke/lint/build.
