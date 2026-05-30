import { appendFile, mkdir } from "fs/promises";
import { createHash } from "crypto";
import path from "node:path";

type ServerAnalyticsEvent =
  | "checkout_completed"
  | "entitlement_granted"
  | "webhook_failed";

type ServerAnalyticsInput = {
  event: ServerAnalyticsEvent;
  userId?: string | null;
  checkoutSessionId?: string | null;
  product?: string | null;
  entitlementKind?: string | null;
  stripeEventType?: string | null;
  webhookStatus?: string | null;
  reason?: string | null;
};

const PRODUCT_ID = "yishun";

function hashId(prefix: string, value?: string | null) {
  if (!value) return `${prefix}_unknown`;
  const digest = createHash("sha256").update(`${PRODUCT_ID}:${value}`).digest("hex").slice(0, 24);
  return `${prefix}_${digest}`;
}

function clean(value?: string | null, fallback = "unknown") {
  if (!value) return fallback;
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 96) || fallback;
}

function buildServerAnalyticsEvent(input: ServerAnalyticsInput) {
  const anonymousId = hashId("user", input.userId);
  const sessionId = hashId("stripe", input.checkoutSessionId);
  const properties = {
    product_id: PRODUCT_ID,
    anonymous_id: anonymousId,
    session_id: sessionId,
    utm_source: "stripe",
    utm_medium: "webhook",
    utm_campaign: "checkout_fulfillment",
    country: "unknown",
    locale: "server",
    device: "server",
    page: "/api/stripe/webhook",
    variant: "server",
    product: clean(input.product),
    entitlementKind: clean(input.entitlementKind),
    stripeEventType: clean(input.stripeEventType),
    webhookStatus: clean(input.webhookStatus),
    reason: clean(input.reason, "none"),
  };

  return {
    event: input.event,
    ts: new Date().toISOString(),
    anonymous_id: anonymousId,
    source: "stripe_webhook",
    properties,
  };
}

export async function recordServerAnalyticsEvent(input: ServerAnalyticsInput) {
  const event = buildServerAnalyticsEvent(input);

  console.info("yishun_server_analytics", {
    event: event.event,
    source: event.source,
    product: event.properties.product,
    webhookStatus: event.properties.webhookStatus,
  });
  console.info(JSON.stringify({ type: "yishun_server_analytics_event", event }));

  const filePath = process.env.YISHUN_ANALYTICS_FILE;
  if (!filePath) return;

  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
  } catch (error) {
    console.warn("server_analytics_file_sink_failed", error);
  }
}
