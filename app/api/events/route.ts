import { appendFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyticsEvent = {
  event: string;
  ts: string;
  properties: Record<string, unknown>;
  anonymous_id?: string;
  source?: string;
};

const PRIVATE_KEYS = new Set([
  "name",
  "real_name",
  "email",
  "phone",
  "birthdate",
  "birth_date",
  "birthtime",
  "birth_time",
  "birthplace",
  "birth_place",
  "birthPlaceText",
  "birthProfile",
  "latitude",
  "longitude",
  "address",
  "location",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function redactPrivateFields(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => redactPrivateFields(item, depth + 1));
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 80)
      .map(([key, nested]) => [
        key,
        PRIVATE_KEYS.has(key) ? "[redacted]" : redactPrivateFields(nested, depth + 1),
      ]),
  );
}

function normalizeEvent(raw: unknown): AnalyticsEvent | null {
  if (!isRecord(raw)) return null;

  const event = cleanText(raw.event ?? raw.name ?? raw.type, 96);
  if (!event) return null;

  const rawProperties = isRecord(raw.properties) ? raw.properties : isRecord(raw.props) ? raw.props : {};
  return {
    event,
    ts: cleanText(raw.ts ?? raw.timestamp, 40) ?? new Date().toISOString(),
    properties: redactPrivateFields(rawProperties) as Record<string, unknown>,
    anonymous_id: cleanText(raw.anonymous_id ?? raw.anonymousId, 96),
    source: cleanText(raw.source, 64),
  };
}

function extractRawEvents(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (isRecord(body) && Array.isArray(body.events)) return body.events;
  if (isRecord(body) && Array.isArray(body.batch)) return body.batch;
  return [body];
}

function persistBestEffort(events: AnalyticsEvent[]) {
  const payload = events.map((event) => JSON.stringify(event)).join("\n") + "\n";

  // Serverless-safe default: structured logs. Optional file sink can be enabled on a stateful host.
  console.info("yishun_analytics_ingest", {
    accepted: events.length,
    events: events.map((event) => event.event),
  });

  const filePath = process.env.YISHUN_ANALYTICS_FILE;
  if (filePath) void appendFile(filePath, payload, "utf8").catch((error) => console.warn("analytics_file_sink_failed", error));
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // Analytics must never block the user flow. Invalid JSON is acknowledged but not accepted.
    return NextResponse.json({ ok: true, accepted: 0, dropped: 1, warning: "invalid_json" });
  }

  const normalized = extractRawEvents(body).map(normalizeEvent);
  const events = normalized.filter((event): event is AnalyticsEvent => Boolean(event)).slice(0, 100);

  if (events.length > 0) persistBestEffort(events);

  return NextResponse.json({
    ok: true,
    accepted: events.length,
    dropped: normalized.length - events.length,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "yishun_analytics_ingest" });
}
