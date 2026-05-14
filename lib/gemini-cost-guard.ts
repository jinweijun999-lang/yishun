import crypto from "node:crypto";

export type GeminiCostDecision =
  | { allowed: true; key: string; cached?: unknown }
  | { allowed: false; reason: "budget_exceeded" | "sampled_out"; key: string };

type UsageBucket = { day: string; count: number };

type CacheEntry<T> = { expiresAt: number; value: T };

const DEFAULT_DAILY_LIMIT = 200;
const DEFAULT_SAMPLE_RATE = 1;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const usage: UsageBucket = { day: todayKey(), count: 0 };
const cache = new Map<string, CacheEntry<unknown>>();

export const GEMINI_MAX_OUTPUT_TOKENS = boundedInteger(process.env.YISHUN_GEMINI_MAX_OUTPUT_TOKENS, 128, 1200, 700);

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function boundedInteger(value: string | undefined, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function boundedRate(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SAMPLE_RATE;
  return Math.max(0, Math.min(1, parsed));
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashPayload(scope: string, payload: unknown) {
  return `${scope}:${crypto.createHash("sha256").update(stableStringify(payload)).digest("hex")}`;
}

function sampleBucket(key: string) {
  const hex = crypto.createHash("sha256").update(key).digest("hex").slice(0, 8);
  return Number.parseInt(hex, 16) / 0xffffffff;
}

function resetUsageIfNeeded() {
  const currentDay = todayKey();
  if (usage.day !== currentDay) {
    usage.day = currentDay;
    usage.count = 0;
  }
}

export function checkGeminiCostGuard(scope: string, payload: unknown): GeminiCostDecision {
  const key = hashPayload(scope, payload);
  const now = Date.now();
  const ttl = boundedInteger(process.env.YISHUN_GEMINI_CACHE_TTL_MS, 0, 7 * DEFAULT_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return { allowed: true, key, cached: cached.value };
  if (cached) cache.delete(key);

  const sampleRate = boundedRate(process.env.YISHUN_GEMINI_SAMPLE_RATE);
  if (sampleRate <= 0 || sampleBucket(key) > sampleRate) return { allowed: false, reason: "sampled_out", key };

  resetUsageIfNeeded();
  const dailyLimit = boundedInteger(process.env.YISHUN_GEMINI_DAILY_LIMIT, 0, 100000, DEFAULT_DAILY_LIMIT);
  if (dailyLimit <= 0 || usage.count >= dailyLimit) return { allowed: false, reason: "budget_exceeded", key };

  usage.count += 1;
  return { allowed: true, key };
}

export function rememberGeminiResult<T>(key: string, value: T) {
  const ttl = boundedInteger(process.env.YISHUN_GEMINI_CACHE_TTL_MS, 0, 7 * DEFAULT_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS);
  if (ttl <= 0) return;
  cache.set(key, { expiresAt: Date.now() + ttl, value });
  // Keep memory bounded in long-lived Node processes.
  if (cache.size > 1000) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

export function getGeminiCostGuardSnapshot() {
  resetUsageIfNeeded();
  return {
    day: usage.day,
    used: usage.count,
    dailyLimit: boundedInteger(process.env.YISHUN_GEMINI_DAILY_LIMIT, 0, 100000, DEFAULT_DAILY_LIMIT),
    sampleRate: boundedRate(process.env.YISHUN_GEMINI_SAMPLE_RATE),
    cacheSize: cache.size,
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
  };
}
