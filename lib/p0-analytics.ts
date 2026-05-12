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
    window.localStorage.setItem("yishun:p0AnalyticsQueue", JSON.stringify([...queue.slice(-49), entry]));
  } catch {
    // Analytics must never block the ritual flow.
  }
  console.info("[YiShun P0 analytics]", event, properties);
  window.dispatchEvent(new CustomEvent("yishun:analytics", { detail: entry }));
}
