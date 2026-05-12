import crypto from "crypto";

export const SHARE_ID_PREFIX = "shr_";

export const ALLOWED_SOURCE_SCREENS = ["daily_card", "bazi_result", "compatibility_pulse"] as const;
export const ALLOWED_CARD_TYPES = ["daily_luck", "bazi_summary", "compatibility_summary", "talisman"] as const;
export const ALLOWED_TEMPLATE_IDS = ["minimal", "mystic", "cute_asian_wisdom"] as const;

type SourceScreen = (typeof ALLOWED_SOURCE_SCREENS)[number];
type CardType = (typeof ALLOWED_CARD_TYPES)[number];
type TemplateId = (typeof ALLOWED_TEMPLATE_IDS)[number];

export type PublicSharePayload = {
  title: string;
  theme: string;
  summary: string;
  lucky_color?: string;
  element_hint?: string;
  best_window?: string;
  avoid_window?: string;
  action?: string;
  score_label?: string;
};

export type CreateShareInput = {
  anonymous_id?: string;
  source_screen: SourceScreen;
  card_type: CardType;
  template_id: TemplateId;
  locale?: string;
  payload: PublicSharePayload;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
};

export function createShareId() {
  return `${SHARE_ID_PREFIX}${crypto.randomBytes(12).toString("base64url")}`;
}

export function shareExpiresAt(now = new Date()) {
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, maxLength);
}

const blockedPayloadKeys = new Set([
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
  "birth_place_text",
  "birthPlaceText",
  "birthProfile",
  "birth_profile",
  "latitude",
  "longitude",
  "address",
  "location",
]);

function containsBlockedKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsBlockedKey);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, nested]) => blockedPayloadKeys.has(key) || containsBlockedKey(nested));
}

function pickAllowed<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeCreateShareInput(raw: unknown): { ok: true; value: CreateShareInput } | { ok: false; error: string } {
  if (!isRecord(raw)) return { ok: false, error: "invalid_payload" };
  if (containsBlockedKey(raw.payload)) return { ok: false, error: "payload_contains_private_fields" };

  const payloadRecord = isRecord(raw.payload) ? raw.payload : {};
  const title = cleanText(payloadRecord.title, 80);
  const theme = cleanText(payloadRecord.theme, 40) ?? "Daily timing";
  const summary = cleanText(payloadRecord.summary, 180);
  if (!title || !summary) return { ok: false, error: "missing_public_payload" };

  const payload: PublicSharePayload = {
    title,
    theme,
    summary,
  };

  const optionalFields: Array<[keyof PublicSharePayload, number]> = [
    ["lucky_color", 32],
    ["element_hint", 32],
    ["best_window", 48],
    ["avoid_window", 96],
    ["action", 120],
    ["score_label", 32],
  ];
  for (const [key, maxLength] of optionalFields) {
    const cleaned = cleanText(payloadRecord[key], maxLength);
    if (cleaned) payload[key] = cleaned;
  }

  const utm = isRecord(raw.utm)
    ? {
        source: cleanText(raw.utm.source, 64),
        medium: cleanText(raw.utm.medium, 64),
        campaign: cleanText(raw.utm.campaign, 64),
      }
    : undefined;

  return {
    ok: true,
    value: {
      anonymous_id: cleanText(raw.anonymous_id, 96),
      source_screen: pickAllowed(raw.source_screen, ALLOWED_SOURCE_SCREENS, "bazi_result"),
      card_type: pickAllowed(raw.card_type, ALLOWED_CARD_TYPES, "daily_luck"),
      template_id: pickAllowed(raw.template_id, ALLOWED_TEMPLATE_IDS, "mystic"),
      locale: cleanText(raw.locale, 12) ?? "en-US",
      payload,
      utm,
    },
  };
}

export function isValidShareId(value: string) {
  return /^shr_[A-Za-z0-9_-]{12,40}$/.test(value);
}
