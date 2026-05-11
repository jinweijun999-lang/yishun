# iOS Info.plist / App Store privacy additions

Use these notes when the Capacitor shell is created in Xcode. Do not add permissions until the matching native feature exists.

## Bundle identifiers

- Production: `com.yishun.app`
- Internal/staging: `com.yishun.staging`

## Required links in app review metadata

- Privacy Policy: `https://11263.com/privacy`
- Terms / disclaimer: `https://11263.com/terms`
- Account deletion: `https://11263.com/account/delete`

## Permissions

P0 web flow manually collects birth place/timezone and does **not** require native location, camera, microphone, contacts, photo library, or tracking permissions.

Only add these later if implemented:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>YiShun uses tracking only if you opt in to personalized ads across apps and websites.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>YiShun can use approximate location to estimate timezone and true solar time for your birth profile.</string>
```

## IAP / subscription review checklist

- Use Apple In-App Purchase for digital reports and subscriptions.
- Include title, duration, price, renewal terms, privacy policy, terms, restore purchases, and manage subscription entry.
- If IAP is not ready, hide/disable report purchase/subscription CTAs in the iOS app build and keep sample report preview only.

## App privacy labels to prepare

- Contact info: email if account registration remains.
- User content / sensitive-ish profile data: birth date/time/place used for chart generation.
- Location: approximate/manual coordinates if stored or processed.
- Purchases: once IAP is active.
- Identifiers / usage data / diagnostics: once analytics or crash reporting is active.
