const DEFAULT_EVENT_ENDPOINT = "/api/events";

function getAnalyticsEndpoint() {
  if (typeof window === "undefined") return null;
  const configured = process.env.NEXT_PUBLIC_YISHUN_ANALYTICS_ENDPOINT;
  return configured || DEFAULT_EVENT_ENDPOINT;
}

export function queueP0Analytics(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const entry = {
    event,
    properties,
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
