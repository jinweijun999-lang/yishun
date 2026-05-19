import { queueP0Analytics } from "@/lib/p0-analytics";

export const YISHUN_EVENTS = {
  HOME_VIEW: "home_view",
  FUNNEL_VIEW: "view",
  START_CLICK: "start_click",
  FUNNEL_START: "start",
  FORM_SUBMIT: "form_submit",
  FUNNEL_SUBMIT: "submit",
  FUNNEL_RESULT: "result",
  REPORT_VIEW: "report_view",
  SHARE_CLICK: "share_click",
  FUNNEL_SHARE: "share",
  SAVE_CLICK: "save_click",
  FUNNEL_SAVE: "save",
  PAYWALL_VIEW: "paywall",
  CLICK_PAYWALL: "click_paywall",
  PAYMENT_INTENT: "payment_intent",
  CHECKOUT_START: "checkout_start",
  UNLOCK_SUCCESS: "unlock_success",
  AI_STATUS: "ai_status",
} as const;

export type YiShunEventName = (typeof YISHUN_EVENTS)[keyof typeof YISHUN_EVENTS];

export function trackYiShunEvent(event: YiShunEventName, properties: Record<string, unknown> = {}) {
  queueP0Analytics(event, { ...properties, schema: "p1_growth_v1" });
}
