const DEFAULT_EVENT_ENDPOINT = "/api/events";
const PRODUCT_ID = "yishun";

function getStoredId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;

  const random = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const value = `${prefix}_${random}`;
  storage.setItem(key, value);
  return value;
}

function getAnonymousId() {
  try {
    return getStoredId(window.localStorage, "yishun:anonymousId", "anon");
  } catch {
    return "anon_unavailable";
  }
}

function getSessionId() {
  try {
    return getStoredId(window.sessionStorage, "yishun:sessionId", "session");
  } catch {
    return "session_unavailable";
  }
}

function currentUtm() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || params.get("source") || "direct",
    utm_medium: params.get("utm_medium") || "none",
    utm_campaign: params.get("utm_campaign") || "none",
  };
}

function countryFromLocale(locale: string) {
  const region = locale.split("-")[1];
  return region && /^[A-Z]{2}$/i.test(region) ? region.toUpperCase() : "unknown";
}

function deviceType() {
  const userAgent = navigator.userAgent || "";
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

function eventContext() {
  const locale = navigator.language || "unknown";
  return {
    product_id: PRODUCT_ID,
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    ...currentUtm(),
    country: countryFromLocale(locale),
    locale,
    device: deviceType(),
    page: `${window.location.pathname}${window.location.hash || ""}`,
    variant: process.env.NEXT_PUBLIC_YISHUN_EXPERIMENT_VARIANT || "control",
  };
}

function getAnalyticsEndpoint() {
  if (typeof window === "undefined") return null;
  const configured = process.env.NEXT_PUBLIC_YISHUN_ANALYTICS_ENDPOINT;
  return configured || DEFAULT_EVENT_ENDPOINT;
}

export function queueP0Analytics(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const context = eventContext();
  const entry = {
    event,
    anonymous_id: context.anonymous_id,
    source: context.utm_source,
    properties: {
      ...context,
      ...properties,
      product_id: PRODUCT_ID,
    },
    ts: new Date().toISOString(),
  };
  try {
    const existing = window.localStorage.getItem("yishun:p0AnalyticsQueue");
    const queue = existing ? (JSON.parse(existing) as unknown[]) : [];
    window.localStorage.setItem("yishun:p0AnalyticsQueue", JSON.stringify([...queue.slice(-79), entry]));
  } catch {
    // Analytics must never block the ritual flow.
  }
  console.info("[YiShun P0 analytics]", event, properties);
  window.dispatchEvent(new CustomEvent("yishun:analytics", { detail: entry }));

  const endpoint = getAnalyticsEndpoint();
  if (!endpoint) return;
  try {
    const payload = JSON.stringify(entry);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Endpoint fallback is best-effort; local queue + console remain the source of truth for P0.
  }
}
