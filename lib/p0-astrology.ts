import {
  buildBaziProfile,
  computeElementBalance,
  computeFourPillars,
  generateInterpretation,
  type ElementBalance,
  type FourPillarsInput,
  type FourPillarsResult,
  type Gender,
} from "@/lib/bazi";

export type BirthProfileInput = {
  birthDate: string;
  birthTime?: string | null;
  birthTimeKnown: boolean;
  birthPlaceText?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  timezoneOffsetMinutes?: number | null;
  timezoneName?: string | null;
  gender?: Gender;
  locale?: "en" | "zh";
};

export type DailySignal = {
  score: number;
  bestFor: string[];
  do: string;
  avoid: string;
  bestHour: string;
  luckyElement: string;
  luckyDirection: string;
  why: string;
  deeperInsight: string;
  disclaimer: string;
};

type SignalLocale = "en" | "zh";

const ELEMENT_DETAILS: Record<string, {
  label: string;
  direction: string;
  color: string;
  microAction: string;
  meaning: string;
}> = {
  Wood: {
    label: "Wood",
    direction: "East",
    color: "Jade green",
    microAction: "write the next step before making a commitment",
    meaning: "growth, planning, learning, and flexible decisions",
  },
  Fire: {
    label: "Fire",
    direction: "South",
    color: "Warm red",
    microAction: "share one clear message instead of over-explaining",
    meaning: "visibility, warmth, momentum, and expression",
  },
  Earth: {
    label: "Earth",
    direction: "Center / Northeast",
    color: "Amber",
    microAction: "choose the stable option and confirm the details",
    meaning: "stability, trust, boundaries, and practical follow-through",
  },
  Metal: {
    label: "Metal",
    direction: "West",
    color: "Pearl white",
    microAction: "cut one unnecessary task before starting something new",
    meaning: "structure, standards, focus, and decisive pruning",
  },
  Water: {
    label: "Water",
    direction: "North",
    color: "Deep blue",
    microAction: "pause for ten minutes before replying to important messages",
    meaning: "reflection, adaptability, research, and emotional clarity",
  },
};

const ZH_ELEMENT_DETAILS: Record<string, { label: string; direction: string; color: string; meaning: string; microAction: string }> = {
  Wood: { label: "木", direction: "东方", color: "青绿色", meaning: "成长、规划、学习与弹性决策", microAction: "先写下下一步，再做承诺" },
  Fire: { label: "火", direction: "南方", color: "暖红色", meaning: "表达、热度、行动势能与可见度", microAction: "只表达一个清晰重点，避免过度解释" },
  Earth: { label: "土", direction: "中宫 / 东北", color: "琥珀色", meaning: "稳定、信任、边界与务实推进", microAction: "选择更稳定的方案，并确认关键细节" },
  Metal: { label: "金", direction: "西方", color: "珍珠白", meaning: "结构、标准、聚焦与果断取舍", microAction: "开始新事前，先砍掉一个不必要任务" },
  Water: { label: "水", direction: "北方", color: "深蓝色", meaning: "反思、适应、调研与情绪清晰度", microAction: "回复重要消息前，先暂停十分钟" },
};

const ELEMENT_KEY_TO_LABEL: Record<keyof ElementBalance, string> = {
  wood: "Wood",
  fire: "Fire",
  earth: "Earth",
  metal: "Metal",
  water: "Water",
};

const TEN_GOD_PATTERN_LABELS: Record<string, { label: string; plain: string }> = {
  Friend: { label: "Peer Pattern", plain: "independence, allies, and healthy competition" },
  "Rob Wealth": { label: "Peer Pattern", plain: "resource boundaries and competitive cooperation" },
  "Eating God": { label: "Expression Pattern", plain: "creative output, enjoyment, and gentle productivity" },
  Hurting: { label: "Expression Pattern", plain: "innovation, direct speech, and rule-questioning energy" },
  Direct: { label: "Structure / Wealth Pattern", plain: "responsibility, steady value, and practical commitments" },
  Indirect: { label: "Opportunity / Support Pattern", plain: "intuition, unconventional options, and flexible resources" },
  Seven: { label: "Pressure Pattern", plain: "challenge, urgency, and disciplined response under pressure" },
};

const ZH_TEN_GOD_PATTERN_LABELS: Record<string, { label: string; plain: string }> = {
  Friend: { label: "同伴结构", plain: "独立性、协作伙伴与健康竞争" },
  "Rob Wealth": { label: "同伴结构", plain: "资源边界与竞争中的协作" },
  "Eating God": { label: "表达结构", plain: "创意产出、愉悦感与温和生产力" },
  Hurting: { label: "表达结构", plain: "创新、直接表达与挑战规则的能量" },
  Direct: { label: "结构 / 财星模式", plain: "责任、稳定价值与务实承诺" },
  Indirect: { label: "机会 / 支持模式", plain: "直觉、非常规选择与弹性资源" },
  Seven: { label: "压力结构", plain: "挑战、紧迫感与压力下的纪律回应" },
};

function normalizeGender(value: unknown): Gender {
  return value === "male" || value === "female" || value === "other" ? value : "other";
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function assertIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("INVALID_BIRTH_DATE");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!isRealDate || year < 1900 || year > 2100) throw new Error("INVALID_BIRTH_DATE");
}

function assertClockTime(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error("INVALID_BIRTH_TIME");
}

export function normalizeBirthProfileInput(raw: Record<string, unknown>): BirthProfileInput {
  const birthDate = typeof raw.birthDate === "string" ? raw.birthDate.trim() : "";
  const birthTimeKnown = raw.birthTimeKnown !== false && raw.birthTime !== null;
  const suppliedBirthTime = typeof raw.birthTime === "string" ? raw.birthTime.trim() : "";
  const birthTime = birthTimeKnown && suppliedBirthTime ? suppliedBirthTime : "12:00";

  assertIsoDate(birthDate);
  assertClockTime(birthTime);

  return {
    birthDate,
    birthTime,
    birthTimeKnown: birthTimeKnown && Boolean(suppliedBirthTime),
    birthPlaceText: typeof raw.birthPlaceText === "string" ? raw.birthPlaceText : null,
    longitude: parseOptionalNumber(raw.longitude),
    latitude: parseOptionalNumber(raw.latitude),
    timezoneOffsetMinutes: parseOptionalNumber(raw.timezoneOffsetMinutes),
    timezoneName: typeof raw.timezoneName === "string" ? raw.timezoneName : null,
    gender: normalizeGender(raw.gender),
    locale: raw.locale === "zh" || raw.locale === "zh-CN" ? "zh" : "en",
  };
}

export function buildPreviewChart(input: BirthProfileInput) {
  const baseInput: FourPillarsInput = {
    birthDate: input.birthDate,
    birthTime: input.birthTime ?? "12:00",
    gender: input.gender ?? "other",
    longitude: input.longitude ?? undefined,
    latitude: input.latitude ?? undefined,
    timezoneOffsetMinutes: input.timezoneOffsetMinutes ?? undefined,
    timezoneName: input.timezoneName ?? undefined,
  };
  const chart = computeFourPillars(baseInput);
  const rawChart = computeFourPillars({
    birthDate: input.birthDate,
    birthTime: input.birthTime ?? "12:00",
    gender: input.gender ?? "other",
  });
  const profile = buildBaziProfile(chart);
  const rawInterpretation = generateInterpretation(chart);
  const interpretation = input.locale === "zh" ? localizeInterpretationZh(rawInterpretation) : rawInterpretation;
  const balance = computeElementBalance(chart);
  const ordered = (Object.entries(balance) as Array<[keyof ElementBalance, number]>)
    .sort((a, b) => b[1] - a[1]);
  const dominantElement = ELEMENT_KEY_TO_LABEL[ordered[0][0]];
  const missingElement = ELEMENT_KEY_TO_LABEL[ordered[ordered.length - 1][0]];
  const changedHourPillar = rawChart.fourPillars.hour.pillar !== chart.fourPillars.hour.pillar;
  const changedDayBoundary = rawChart.fourPillars.day.pillar !== chart.fourPillars.day.pillar;
  const tenGodPattern = summarizeTenGodPattern(chart, input.locale);

  return {
    input,
    chart,
    profile,
    interpretation,
    elementsBalance: balance,
    dominantElement,
    missingElement,
    favorableElement: interpretation.favorableElements[0] ?? missingElement,
    trueSolarTime: chart.trueSolarTime
      ? {
          ...chart.trueSolarTime,
          changedHourPillar,
          changedDayBoundary,
          precision: input.birthTimeKnown ? "high" : "medium_unknown_birth_time",
        }
      : null,
    tenGodPattern,
  };
}

export function generateDailySignal(chart: FourPillarsResult, birthTimeKnown = true, locale: "en" | "zh" = "en"): DailySignal {
  const interpretation = generateInterpretation(chart);
  const balance = computeElementBalance(chart);
  const values = Object.values(balance);
  const dominant = (Object.entries(balance) as Array<[keyof ElementBalance, number]>)
    .sort((a, b) => b[1] - a[1])[0][0];
  const favorableElement = interpretation.favorableElements[0] ?? ELEMENT_KEY_TO_LABEL[dominant];
  const detail = ELEMENT_DETAILS[favorableElement] ?? ELEMENT_DETAILS.Wood;
  const daySeed = new Date().getUTCDate() + chart.fourPillars.day.stem.name.length + chart.fourPillars.month.branch.name.length;
  const score = Math.max(62, Math.min(92, 70 + (daySeed % 17) + Math.round((Math.max(...values) - Math.min(...values)) / 2)));
  const bestForByElement: Record<string, string[]> = locale === "zh" ? {
    Wood: ["规划", "学习", "慢决策"],
    Fire: ["表达展示", "创意推进", "温和沟通"],
    Earth: ["复核细节", "预算安排", "稳定承诺"],
    Metal: ["确定优先级", "协商边界", "专注执行"],
    Water: ["调研", "反思", "敏感沟通"],
  } : {
    Wood: ["planning", "learning", "slow decisions"],
    Fire: ["presenting", "creative momentum", "warm outreach"],
    Earth: ["reviewing details", "budgeting", "stable commitments"],
    Metal: ["prioritizing", "negotiating boundaries", "focused execution"],
    Water: ["research", "reflection", "sensitive conversations"],
  };
  const avoidByElement: Record<string, string> = locale === "zh" ? {
    Wood: "选项还没充分展开前，不要强迫自己立刻定案",
    Fire: "不要为了维持热度而仓促反应",
    Earth: "规则没确认前，不要答应模糊计划",
    Metal: "不要因为还不完美就砍掉有用选项",
    Water: "不要过度解读信号，却不选择一个小行动",
  } : {
    Wood: "forcing a final answer before the options have room to grow",
    Fire: "reacting quickly just to keep the energy high",
    Earth: "saying yes to vague plans without confirming the ground rules",
    Metal: "cutting off a useful option because it is not perfect yet",
    Water: "over-reading signals without choosing one small next step",
  };
  const hourByElement: Record<string, string> = {
    Wood: "07:00–09:00",
    Fire: "11:00–13:00",
    Earth: "13:00–15:00",
    Metal: "17:00–19:00",
    Water: "21:00–23:00",
  };

  if (locale === "zh") {
    const zhDetail = ZH_ELEMENT_DETAILS[favorableElement] ?? ZH_ELEMENT_DETAILS.Wood;
    const bestForByElementZh: Record<string, string[]> = {
      Wood: ["规划", "学习", "慢决策"],
      Fire: ["表达展示", "创意推进", "温和沟通"],
      Earth: ["复核细节", "预算安排", "稳定承诺"],
      Metal: ["确定优先级", "协商边界", "专注执行"],
      Water: ["调研", "反思", "敏感沟通"],
    };
    const avoidByElementZh: Record<string, string> = {
      Wood: "选项还没充分展开前，不要强迫自己立刻定案",
      Fire: "不要为了维持热度而仓促反应",
      Earth: "规则没确认前，不要答应模糊计划",
      Metal: "不要因为还不完美就砍掉有用选项",
      Water: "不要过度解读信号，却不选择一个小行动",
    };
    return {
      score,
      bestFor: bestForByElementZh[favorableElement] ?? bestForByElementZh.Wood,
      do: `借用${zhDetail.label}的能量：${zhDetail.microAction}。`,
      avoid: avoidByElementZh[favorableElement] ?? avoidByElementZh.Wood,
      bestHour: birthTimeKnown ? (hourByElement[favorableElement] ?? "09:00–11:00") : "出生时间未知：可作为全天宽泛信号参考",
      luckyElement: zhDetail.label,
      luckyDirection: zhDetail.direction,
      why: `今天你的命盘适合借助${zhDetail.meaning}。这个信号结合日主、五行平衡、阴阳节律与真太阳时校准后的出生信息生成。`,
      deeperInsight: `解锁层会把十神转成更容易理解的行动模式：${summarizeTenGodPattern(chart, "zh").plain}。请把它当作反思提示，而不是固定预测。`,
      disclaimer: "仅供娱乐和自我反思；不提供医疗、金融、法律或重大人生决策建议。",
    };
  }

  return {
    score,
    bestFor: bestForByElement[favorableElement] ?? bestForByElement.Wood,
    do: `Borrow ${detail.label} energy: ${detail.microAction}.`,
    avoid: avoidByElement[favorableElement] ?? avoidByElement.Wood,
    bestHour: birthTimeKnown ? (hourByElement[favorableElement] ?? "09:00–11:00") : "Use as a broad day signal — birth time is unknown",
    luckyElement: detail.label,
    luckyDirection: detail.direction,
    why: `Your chart benefits from ${detail.meaning} today. The signal is based on your Day Master, Five Elements balance, Yin/Yang rhythm, and true-solar-time adjusted birth profile.`,
    deeperInsight: `The unlocked layer translates Ten Gods into user-friendly patterns. ${summarizeTenGodPattern(chart, "en").plain}. Use this as a reflection prompt, not a fixed prediction.`,
    disclaimer: "For entertainment and self-reflection only. YiShun does not provide medical, financial, legal, or life-critical advice.",
  };
}

export function summarizeTenGodPattern(chart: FourPillarsResult, locale: SignalLocale = "en") {
  const gods = [
    chart.fourPillars.year.stemTenGod,
    chart.fourPillars.month.stemTenGod,
    chart.fourPillars.hour.stemTenGod,
  ].filter(Boolean).join(" | ");
  const matchKey = Object.keys(TEN_GOD_PATTERN_LABELS).find((key) => gods.includes(key));
  if (locale === "zh") return ZH_TEN_GOD_PATTERN_LABELS[matchKey ?? "Friend"] ?? ZH_TEN_GOD_PATTERN_LABELS.Friend;
  return TEN_GOD_PATTERN_LABELS[matchKey ?? "Friend"] ?? TEN_GOD_PATTERN_LABELS.Friend;
}

function localizeInterpretationZh(interpretation: ReturnType<typeof generateInterpretation>) {
  const elementZh: Record<string, string> = { Wood: "木", Fire: "火", Earth: "土", Metal: "金", Water: "水" };
  return {
    ...interpretation,
    dayMasterDescription: "日主描述已生成：用于理解你的基础节律与行动倾向。",
    monthSeasonDescription: "月令季节结构已计算：用于判断当前命盘的背景力量。",
    strengthAnalysis: "日主强弱已估算：用于判断今天更适合补充、输出还是稳住节奏。",
    favorableElements: interpretation.favorableElements.map((item) => elementZh[item] ?? item),
  };
}

export { ELEMENT_DETAILS };
