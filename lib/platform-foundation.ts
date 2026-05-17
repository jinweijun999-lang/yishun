export const productConfig = {
  id: "yishun-fortune-v1",
  name: "YiShun — Daily Eastern Timing & AI Fortune Companion",
  version: "consumer-v1-foundation",
  privacy: {
    relationshipLitePersistsPartner: false,
    aiQuestionRequiresConfirmBeforeCharge: true,
  },
  support: {
    email: "support@yishun.app",
    feedbackUrl: "/profile#feedback-support",
    feedbackApi: "/api/support/feedback",
  },
} as const;

export const remoteConfigDefaults = {
  relationshipLiteEnabled: true,
  aiQuestionEnabled: true,
  dailyTimingTraceEnabled: true,
  paymentMode: "confirm_before_charge",
  analyticsEndpoint: "/api/events",
} as const;

export const analyticsEventDictionary = {
  relationshipLiteView: "relationship_lite_view",
  relationshipLiteSubmit: "relationship_lite_submit",
  aiQuestionView: "ai_question_view",
  aiQuestionPrecheck: "ai_question_precheck",
  aiQuestionConfirmIntent: "ai_question_confirm_intent",
  aiQuestionMockPaidExecute: "ai_question_mock_paid_execute",
  aiQuestionMockRollback: "ai_question_mock_rollback",
  dailyTimingView: "daily_timing_view",
  dailyTimingSubmit: "daily_timing_submit",
  feedbackOpen: "feedback_open",
  feedbackSubmit: "feedback_submit",
  supportTicketCreated: "support_ticket_created",
  paywallPrecheck: "paywall_precheck",
  ritualView: "ritual_view",
  ritualOpen: "ritual_open",
} as const;

export type EntitlementCheck = {
  allowed: boolean;
  reason: "included" | "has_credit" | "needs_credit" | "confirm_required";
  creditsRequired: number;
  currentCredits: number;
  chargeNow: false;
};

export function checkQuestionEntitlement(currentCredits: number, confirmed: boolean): EntitlementCheck {
  if (currentCredits > 0 && confirmed) {
    return { allowed: true, reason: "has_credit", creditsRequired: 1, currentCredits, chargeNow: false };
  }
  if (currentCredits > 0) {
    return { allowed: false, reason: "confirm_required", creditsRequired: 1, currentCredits, chargeNow: false };
  }
  return { allowed: false, reason: "needs_credit", creditsRequired: 1, currentCredits: Math.max(0, currentCredits), chargeNow: false };
}

export const promptTemplates = {
  aiQuestionSafety: "Use BaZi signals as reflective context only. No medical, legal, financial, investment, or deterministic claims.",
  relationshipLite: "Summarize relationship dynamics from two birth profiles without storing partner private data.",
  dailyTimingTrace: "Show date, input fields, calculated pillar/element signals, and why the timing recommendation follows.",
} as const;
