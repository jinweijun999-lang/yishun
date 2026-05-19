import { checkGeminiCostGuard, GEMINI_MAX_OUTPUT_TOKENS, rememberGeminiResult } from "@/lib/gemini-cost-guard";
import type { DailySignal } from "@/lib/p0-astrology";
import { hasForbiddenClaim, normalizeTerminology } from "@/lib/yishun-terminology";

type GeminiDailyReadingInput = {
  locale: "en" | "zh";
  focus?: string | null;
  dayMaster: string;
  dominantElement: string;
  missingElement: string;
  favorableElement: string;
  tenGodPattern: { label: string; plain: string };
  dailySignal: DailySignal;
  fourPillars: Record<string, { pillar: string; stemTenGod?: string }>;
  trueSolarTime: null | { date: string; time: string; offsetMinutes: number; precision?: string };
};

export type GeminiDailyReading = {
  status: "enhanced" | "fallback";
  model?: string;
  reason?: string;
  generatedAt: string;
  summary: string;
  action: string;
  explanation: string;
  terminologyNote: string;
};

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY_YISHUN
  ?? process.env.GOOGLE_API_KEY
  ?? process.env.GEMINI_API_KEY
  ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const GOOGLE_MODELS = [
  process.env.GOOGLE_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash",
].filter((model): model is string => Boolean(model));

function fallbackReading(input: GeminiDailyReadingInput, reason?: string): GeminiDailyReading {
  const isZh = input.locale === "zh";
  return {
    status: "fallback",
    reason,
    generatedAt: new Date().toISOString(),
    summary: isZh
      ? `今日信号围绕${input.dailySignal.luckyElement}能量展开，适合把注意力放在${input.dailySignal.bestFor.slice(0, 2).join("、")}。`
      : `Today’s signal centers on ${input.dailySignal.luckyElement} energy and favors ${input.dailySignal.bestFor.slice(0, 2).join(" and ")}.`,
    action: input.dailySignal.do,
    explanation: isZh
      ? `系统已根据四柱、五行平衡、日主与真太阳时生成基础解释。该内容用于自我反思，不做确定性预测。`
      : `The rule engine generated this from the Four Pillars, Five Elements balance, Day Master, and True Solar Time. Use it for reflection, not deterministic prediction.`,
    terminologyNote: isZh
      ? "术语说明：日主=出生日天干；五行=木火土金水；真太阳时=按出生地校准后的时间。"
      : "Terminology: Day Master means the Day Heavenly Stem; Five Elements means Wood, Fire, Earth, Metal, Water; True Solar Time means location-adjusted birth time.",
  };
}

function buildPrompt(input: GeminiDailyReadingInput) {
  const isZh = input.locale === "zh";
  const schema = isZh
    ? `仅输出 JSON：{"summary":"一段用户读得懂的今日概述，不超过70字","action":"一条具体行动建议，不超过45字","explanation":"专业依据解释，不超过120字，必须准确使用术语","terminologyNote":"用通俗语言解释1-2个术语，不超过70字"}`
    : `Return JSON only: {"summary":"user-friendly daily summary, max 45 words","action":"one concrete action, max 30 words","explanation":"technical basis, max 80 words, use accurate terminology","terminologyNote":"plain-language explanation of 1-2 terms, max 45 words"}`;

  const policy = isZh
    ? `你是 YiShun 的东方时机解读编辑。规则引擎已经完成底层计算，你只能基于给定结构化数据做个性化表达，不能发明新的命盘结论。术语必须准确：八字/BaZi、四柱/Four Pillars、日主/Day Master、天干/Heavenly Stem、地支/Earthly Branch、五行/Five Elements、十神/Ten Gods、真太阳时/True Solar Time。不要做医疗、金融、法律、投资或确定性预测。语言要让普通用户读懂。`
    : `You are YiShun's Eastern timing interpretation editor. The rule engine has already computed the chart; you only personalize the wording from structured data. Do not invent new chart conclusions. Use accurate terms: BaZi, Four Pillars, Day Master, Heavenly Stem, Earthly Branch, Five Elements / Wu Xing, Ten Gods / Shi Shen, True Solar Time. Do not provide medical, financial, legal, investment, or deterministic predictions. Make it easy for ordinary users to understand.`;

  return `${policy}\n\n${schema}\n\nStructured data:\n${JSON.stringify(input, null, 2)}`;
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("GEMINI_JSON_PARSE_FAILED");
    return JSON.parse(match[0]);
  }
}

function validateReading(raw: unknown, locale: "en" | "zh", model: string): GeminiDailyReading {
  const data = raw as Partial<Record<"summary" | "action" | "explanation" | "terminologyNote", unknown>>;
  const summary = typeof data.summary === "string" ? normalizeTerminology(data.summary.trim(), locale) : "";
  const action = typeof data.action === "string" ? normalizeTerminology(data.action.trim(), locale) : "";
  const explanation = typeof data.explanation === "string" ? normalizeTerminology(data.explanation.trim(), locale) : "";
  const terminologyNote = typeof data.terminologyNote === "string" ? normalizeTerminology(data.terminologyNote.trim(), locale) : "";
  const combined = `${summary}\n${action}\n${explanation}\n${terminologyNote}`;

  if (!summary || !action || !explanation || !terminologyNote) throw new Error("GEMINI_SCHEMA_INVALID");
  if (hasForbiddenClaim(combined)) throw new Error("GEMINI_POLICY_INVALID");

  return { status: "enhanced", model, generatedAt: new Date().toISOString(), summary, action, explanation, terminologyNote };
}

export async function generateGeminiDailyReading(input: GeminiDailyReadingInput): Promise<GeminiDailyReading> {
  if (process.env.ENABLE_GEMINI_DAILY_READING === "false") {
    return fallbackReading(input, "disabled_by_feature_flag");
  }
  if (!GOOGLE_API_KEY) return fallbackReading(input, "missing_google_api_key");

  const guard = checkGeminiCostGuard("daily-reading", input);
  if (!guard.allowed) return fallbackReading(input, guard.reason);
  if (guard.cached) return guard.cached as GeminiDailyReading;

  const prompt = buildPrompt(input);
  const errors: string[] = [];
  for (const model of Array.from(new Set(GOOGLE_MODELS))) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS, responseMimeType: "application/json" },
        }),
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP_${response.status}:${await response.text()}`);
      const payload = await response.json();
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("GEMINI_EMPTY_TEXT");
      const result = validateReading(parseJson(text), input.locale, model);
      rememberGeminiResult(guard.key, result);
      return result;
    } catch (error) {
      errors.push(`${model}:${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return fallbackReading(input, errors.join(" | "));
}
