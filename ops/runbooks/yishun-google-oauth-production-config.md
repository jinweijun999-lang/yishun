# YiShun Google OAuth Production Config

## Contract

Google sign-in is not launch-ready until the Google Cloud OAuth client and YiShun production environment agree on the same callback URL.

Required production values:

```text
NEXT_PUBLIC_APP_URL=https://11263.com
NEXT_PUBLIC_SITE_URL=https://11263.com
NEXTAUTH_URL=https://11263.com
YISHUN_GOOGLE_OAUTH_REQUIRED=1
GOOGLE_CLIENT_ID=<Google OAuth web client id>
GOOGLE_CLIENT_SECRET=<Google OAuth web client secret>
GOOGLE_OAUTH_REDIRECT_URI=https://11263.com/api/auth/callback/google
```

Authorized redirect URI in Google Cloud:

```text
https://11263.com/api/auth/callback/google
```

## Verification

Run these checks before enabling Google sign-in in production:

```bash
npm run audit:production-config
npm run audit:monitoring-contract
npm run smoke:production -- --base-url=https://11263.com
```

Then verify `/api/health` and `/status` show `googleOAuth` as `configured` and that `integrations.googleOAuth.redirectMatches` is `true`.

## Boundaries

- Do not commit Google OAuth secrets.
- Do not delete or rotate an existing OAuth client during unattended runs.
- If browser login, consent screen approval, or 2FA blocks validation, report the blocker and continue another YiShun launch-readiness workstream.
