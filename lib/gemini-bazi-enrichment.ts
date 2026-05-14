import { z } from "zod";
import { checkGeminiCostGuard, GEMINI_MAX_OUTPUT_TOKENS, rememberGeminiResult } from "@/lib/gemini-cost-guard";
import type { BirthProfileInput, DailySignal } from "@/lib/p0-astrology";

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY_YISHUN
  ?? process.env.GOOGLE_API_KEY
  ?? process.env.GEMINI_API_KEY
  ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const GEMINI_TIMEOUT_MS = Number(process.env.YISHUN_GEMINI_TIMEOUT_MS ?? 9000);
const GOOGLE_MODELS = [
  process.env.GOOGLE_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash",
].filter((model): model is string => Boolean(model));

export const aiBaziInterpretationSchema = z.strictObject({
  summary: z.string().min(40).max(900),
  signalsUsed: z.array(z.string().min(2).max(120)).min(3).max(8),
  actionSuggestions: z.array(z.string().min(12).max(240)).min(3).max(3),
  reflectionQuestion: z.string().min(12).max(240),
  terminologyNote: z.string().min(20).max(300),
});

const geminiResponseSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    signalsUsed: { type: "ARRAY", items: { type: "STRING" } },
    actionSuggestions: { type: "ARRAY", items: { type: "STRING" } },
    reflectionQuestion: { type: "STRING" },
    terminologyNote: { type: "STRING" },
  },
  required: ["summary", "signalsUsed", "actionSuggestions", "reflectionQuestion", "terminologyNote"],
};

export type AiBaziInterpretation = z.infer<typeof aiBaziInterpretationSchema>;

export type AiBaziField =
  | ({
      status: "ok";
      provider: "gemini";
      model: string;
      attribution: string;
      interpretationBasis: string;
    } & AiBaziInterpretation)
  | {
      status: "fallback";
      provider: "rules";
      reason: "disabled" | "missing_api_key" | "timeout" | "api_error" | "invalid_json" | "validation_failed" | "budget_exceeded" | "sampled_out";
      attribution: string;
      interpretationBasis: string;
    };

type PreviewFacts = {
  birthProfile: {
    birthTimeKnown: boolean;
    birthPlaceText?: string | null;
    timezoneName?: string | null;
    timezoneOffsetMinutes?: number | null;
  };
  trueSolarTime: null | {
    date: string;
    time: string;
    offsetMinutes: number;
    changedHourPillar: boolean;
    changedDayBoundary: boolean;
    precision: string;
  };
  fourPillars: Record<string, { pillar: string; stemTenGod?: string }>;
  dayMaster: string;
  elementsBalance: Record<"wood" | "fire" | "earth" | "metal" | "water", number>;
  dominantElement: string;
  missingElement: string;
  favorableElement: string;
  tenGodPattern: { label: string; plain: string };
  interpretation: { dayMasterDescription: string; strengthAnalysis: string; favorableElements: string[] };
  dailySignal: DailySignal;
  focus?: string;
};

type EnrichmentOptions = {
  enabled?: boolean;
  mockMode?: "success" | "invalid-json" | "timeout" | "failure" | null;
  fetchImpl?: typeof fetch;
};

const attribution = "AI-personalized interpretation based on structured BaZi timing; core chart facts and timing scores are computed by YiShun's rules engine.";
const interpretationBasis = "Rules engine provides BaZi/Four Pillars facts, Day Master, Five Elements balance, Ten Gods pattern, true solar time, score, best hour, and lucky element. AI may only explain those provided signals.";

type AiFallbackReason = Extract<AiBaziField, { status: "fallback" }>["reason"];

function fallback(reason: AiFallbackReason): AiBaziField {
  return { status: "fallback", provider: "rules", reason, attribution, interpretationBasis };
}

function buildPrompt(input: BirthProfileInput, facts: PreviewFacts) {
  const locale = input.locale === "zh" ? "zh" : "en";
  const languageRule = locale === "zh"
    ? "Write in concise Simplified Chinese, but include accurate English terminology in parentheses when first used."
    : "Write in clear plain English for a non-specialist. Keep Chinese terms only when helpful in parentheses.";

  return `You are YiShun's BaZi explanation layer. Output JSON only and follow the schema exactly.

Hard constraints:
- Explain ONLY the provided structured signals. Do not calculate, change, correct, or invent score, bestHour, luckyElement, Four Pillars, Day Master, Five Elements balance, Ten Gods, true solar time, birth facts, or any other core fact.
- Do not claim the AI decides the chart. The rules engine decides core facts; AI only personalizes the interpretation.
- Use accurate terminology: BaZi (八字), Four Pillars (四柱), Day Master (日主 / Day Heavenly Stem), Five Elements (五行: Wood, Fire, Earth, Metal, Water), Ten Gods (十神), true solar time (真太阳时).
- Explain technical terms in plain language; avoid fatalistic claims and avoid medical, financial, legal, or life-critical advice.
- Do not include fields outside this JSON shape: {"summary": string, "signalsUsed": string[], "actionSuggestions": string[3], "reflectionQuestion": string, "terminologyNote": string}.
- Keep summary under 140 words, each action under 28 words, and terminologyNote under 45 words so the JSON is never truncated.
- ${languageRule}

Provided structured signals:
${JSON.stringify({
  locale,
  birthTimeKnown: facts.birthProfile.birthTimeKnown,
  birthPlaceText: facts.birthProfile.birthPlaceText,
  timezoneName: facts.birthProfile.timezoneName,
  timezoneOffsetMinutes: facts.birthProfile.timezoneOffsetMinutes,
  trueSolarTime: facts.trueSolarTime,
  fourPillars: facts.fourPillars,
  dayMaster: facts.dayMaster,
  elementsBalance: facts.elementsBalance,
  dominantElement: facts.dominantElement,
  missingElement: facts.missingElement,
  favorableElement: facts.favorableElement,
  tenGodPattern: facts.tenGodPattern,
  ruleInterpretation: facts.interpretation,
  dailySignal: facts.dailySignal,
  focus: facts.focus ?? "General",
}, null, 2)}`;
}

function parseGeminiText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("invalid_json");
    return JSON.parse(jsonMatch[0]);
  }
}

function mockResponse(mode: NonNullable<EnrichmentOptions["mockMode"]>, locale: BirthProfileInput["locale"]): Promise<AiBaziField> {
  if (mode === "timeout") return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 10));
  if (mode === "failure") return Promise.reject(new Error("api_error"));
  if (mode === "invalid-json") return Promise.reject(new SyntaxError("invalid_json"));
  const zh = locale === "zh";
  return Promise.resolve({
    status: "ok",
    provider: "gemini",
    model: "mock-gemini",
    attribution,
    interpretationBasis,
    summary: zh
      ? "AI 个性化解读基于规则引擎给出的 BaZi（八字）结构：日主、五行平衡、十神模式与真太阳时信号已经固定，以下只把这些信号翻译成今天更容易执行的节奏建议。"
      : "This AI-personalized interpretation starts from YiShun's fixed BaZi signals: the Day Master, Five Elements balance, Ten Gods pattern, true solar time, score, and timing window are already computed by the rules engine.",
    signalsUsed: zh ? ["规则引擎命盘", "日主", "五行平衡", "十神模式", "真太阳时"] : ["rules-engine chart", "Day Master", "Five Elements balance", "Ten Gods pattern", "true solar time"],
    actionSuggestions: zh
      ? ["把最重要的一步安排在规则引擎给出的黄金时段附近。", "用有利五行对应的方式降低今天的阻力。", "先写下一个可验证的小动作，再扩大承诺。"]
      : ["Place the most important step near the rules-engine best-hour window.", "Use the favorable Five Element as a practical style cue, not a prediction.", "Write one verifiable next step before making a larger commitment."],
    reflectionQuestion: zh ? "今天哪一个决定最需要先缩小范围，再行动？" : "Which decision today needs a smaller next step before a larger commitment?",
    terminologyNote: zh ? "BaZi/Four Pillars 是结构化命盘语言；AI 只解释已提供信号，不决定命盘。" : "BaZi/Four Pillars is the chart language; AI explains provided signals and does not decide the chart.",
  });
}

export async function enrichBaziPreviewWithGemini(input: BirthProfileInput, facts: PreviewFacts, options: EnrichmentOptions = {}): Promise<AiBaziField> {
  if (options.enabled !== true) return fallback("disabled");
  if (process.env.YISHUN_GEMINI_SERVER_ENABLED === "0") return fallback("disabled");
  if (options.mockMode) {
    try {
      return await mockResponse(options.mockMode, input.locale);
    } catch (error) {
      if (error instanceof SyntaxError) return fallback("invalid_json");
      return fallback(error instanceof Error && error.message === "timeout" ? "timeout" : "api_error");
    }
  }
  if (!GOOGLE_API_KEY) return fallback("missing_api_key");

  const guard = checkGeminiCostGuard("bazi-preview", {
    locale: input.locale,
    birthTimeKnown: input.birthTimeKnown,
    timezoneName: input.timezoneName,
    trueSolarTime: facts.trueSolarTime,
    fourPillars: facts.fourPillars,
    dayMaster: facts.dayMaster,
    elementsBalance: facts.elementsBalance,
    tenGodPattern: facts.tenGodPattern,
    dailySignal: facts.dailySignal,
    focus: facts.focus ?? "General",
  });
  if (!guard.allowed) return fallback(guard.reason);
  if (guard.cached) return guard.cached as AiBaziField;

  const fetcher = options.fetchImpl ?? fetch;
  const prompt = buildPrompt(input, facts);
  const modelErrors: string[] = [];

  for (const model of Array.from(new Set(GOOGLE_MODELS))) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
            responseMimeType: "application/json",
            responseSchema: geminiResponseSchema,
          },
        }),
      });
      if (!response.ok) throw new Error(`api_error_${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== "string" || !text.trim()) throw new Error("invalid_json");
      const parsed = aiBaziInterpretationSchema.safeParse(parseGeminiText(text));
      if (!parsed.success) throw new Error("validation_failed");
      const result = { status: "ok" as const, provider: "gemini" as const, model, attribution, interpretationBasis, ...parsed.data };
      rememberGeminiResult(guard.key, result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      modelErrors.push(`${model}: ${message}`);
      if (message === "AbortError" || (error instanceof DOMException && error.name === "AbortError")) return fallback("timeout");
      // Gemini can occasionally return malformed/truncated JSON for one model even with
      // responseMimeType enabled. Try the next configured model before falling back so
      // production smoke tests do not fail on a single transient generation issue.
      if (message === "validation_failed" || message === "invalid_json" || error instanceof SyntaxError) continue;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (modelErrors.some((item) => item.includes("AbortError"))) return fallback("timeout");
  if (modelErrors.length > 0 && modelErrors.every((item) => item.includes("invalid_json") || item.includes("validation_failed"))) {
    return fallback(modelErrors.some((item) => item.includes("validation_failed")) ? "validation_failed" : "invalid_json");
  }
  return fallback("api_error");
}
