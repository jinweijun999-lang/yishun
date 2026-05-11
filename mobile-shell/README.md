# YiShun mobile app shell plan (P0)

This directory is intentionally dependency-free. It gives operator/coder the minimal Android and iOS wrapper configuration without running Xcode, Bubblewrap, Capacitor sync, app-store submission, Stripe, IAP, or ad SDKs.

## Decision

- **Android P0 recommendation: TWA first** for the hosted Next.js/PWA at `https://11263.com`.
  - Lowest engineering risk and best alignment with the PWA manifest.
  - Requires production HTTPS, valid `assetlinks.json`, Play signing key fingerprint, and Bubblewrap/Android Studio packaging later.
  - Switch to Capacitor only when native AdMob rewarded ads, push, widgets, or deeper device APIs become P0/P1.
- **iOS P0/P1 recommendation: Capacitor/WebView shell** after H5 metrics pass.
  - iOS rejects thin WebView shells more often; add saved profiles, Apple Sign in, push/reminders, report library, and IAP before public submission.
  - Digital reports/subscriptions must use Apple IAP; do not link to external Stripe purchase inside the iOS app.

## Files

- `android/twa-manifest.template.json` — Bubblewrap/TWA input template.
- `android/assetlinks.template.json` — production domain verification template.
- `ios/capacitor.config.template.json` — Capacitor iOS shell config template.
- `ios/Info.plist.additions.md` — privacy/permission/subscription notes for Xcode.

## Android packaging path (not run in this task)

```bash
# after production/staging domain is live and PWA manifest is reachable
npm create @bubblewrap/cli@latest
bubblewrap init --manifest=https://11263.com/manifest.webmanifest
# fill packageId=com.yishun.app, appVersion, signing key, assetlinks fingerprint
bubblewrap build
bubblewrap validate
```

Acceptance before Play internal testing:

1. `https://11263.com/manifest.webmanifest` passes installability checks.
2. `https://11263.com/.well-known/assetlinks.json` contains the release signing SHA-256 fingerprint.
3. App opens `/reading/start?source=android_twa` and system back behavior is sane.
4. Privacy policy, terms, disclaimer, and account deletion entry are reachable in app.
5. If paid digital content is enabled, use Play Billing; otherwise keep paid CTAs as sample/disabled in Android build.

## iOS packaging path (not run in this task)

```bash
# create a separate shell workspace after deciding to enter iOS build phase
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init YiShun com.yishun.app --web-dir=out
# or use a tiny hosted WebView shell if export is not adopted; avoid public submission until native value is added
npx cap add ios
npx cap sync ios
```

Acceptance before TestFlight:

1. Bundle ID: `com.yishun.app` (or `com.yishun.staging` for internal test).
2. In-app payment: Apple IAP wired for reports/subscriptions or paid digital CTAs hidden/disabled.
3. Privacy labels cover birth profile, location text/coordinates, identifiers, purchases, diagnostics, and analytics.
4. ATT only requested if cross-app tracking/ad SDK is introduced; P0 currently should not request ATT.
5. Subscription terms, restore purchases, account deletion, privacy policy, and entertainment-only disclaimer are reachable.
