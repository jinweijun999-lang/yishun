# YiShun Consumer-Grade AI QA Protocol

This protocol is mandatory for every launch, growth, payment, analytics, and UX change that can affect a real user.

## Principle

Every change must be checked from a user perspective before it is called ready. Passing CI is not enough. The AI reviewer must behave like a first-time consumer, not an engineer looking for green checks.

## Required Personas

- First-time mobile visitor: wants a clear reason to start within 10 seconds.
- Cautious spiritual/self-reflection user: needs credible, non-exaggerated copy and clear safety boundaries.
- Paid user: expects checkout, entitlement recovery, and report access to be understandable and trustworthy.
- Returning user: expects saved reports, daily signals, and share links to be easy to find.

## Required Journeys

- Home -> reading start -> preview result -> save/share/pay CTA.
- Membership -> product choice -> checkout start -> success/cancel/recovery expectation.
- Share landing -> CTA back to own reading.
- Status/privacy/terms/support paths when trust or payment concern appears.
- Mobile 390x844 scan for every user-facing route touched by the change.

## Pass Criteria

- The primary next action is visible without hunting.
- Copy sounds like a consumer product, not an internal test build.
- No visible internal words such as mock, placeholder, local, P0, test checkout, or sandbox pending on consumer purchase paths.
- User can recover from loading, empty, auth, payment, and entitlement states.
- Page has no horizontal overflow, broken tap targets, overlapping text, or hidden CTA on mobile.
- Paid flows clearly separate Full Report, Ask Credit, monthly membership, and annual membership.
- Privacy, terms, support, and refund/contact expectations are reachable before or during purchase.
- AI explanations are framed as self-reflection/planning support, not medical, legal, investment, guaranteed relationship, or guaranteed wealth advice.

## Evidence

For each milestone, record:

- Production or staging URL tested.
- Persona and journey tested.
- Commands/scripts run.
- Screenshots or JSON evidence paths when available.
- Issues found, severity, owner, and next action.
- Feishu notification status for meaningful progress, blocker, or go/no-go decision.

## Go / No-Go Rule

Any P0 user journey failure blocks launch or promotion. A P0 failure includes inaccessible home/reading/membership routes, broken checkout start, missing entitlement recovery, public internal/test wording on purchase paths, mobile CTA blockage, or production health failure.
