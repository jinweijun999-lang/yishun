import { queueP0Analytics } from "@/lib/p0-analytics";

export const YISHUN_EVENTS = {
  HOME_VIEW: "home_view",
  START_CLICK: "start_click",
  FORM_SUBMIT: "form_submit",
  REPORT_VIEW: "report_view",
  SHARE_CLICK: "share_click",
  SAVE_CLICK: "save_click",
  PAYMENT_INTENT: "payment_intent",
} as const;

export type YiShunEventName = (typeof YISHUN_EVENTS)[keyof typeof YISHUN_EVENTS];

export function trackYiShunEvent(event: YiShunEventName, properties: Record<string, unknown> = {}) {
  queueP0Analytics(event, { ...properties, schema: "p1_growth_v1" });
}
