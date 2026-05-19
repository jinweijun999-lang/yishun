export const YISHUN_TERMINOLOGY = {
  BaZi: { zh: "八字", en: "BaZi (Eight Characters / Four Pillars)" },
  FourPillars: { zh: "四柱", en: "Four Pillars" },
  DayMaster: { zh: "日主", en: "Day Master (Day Heavenly Stem)" },
  HeavenlyStem: { zh: "天干", en: "Heavenly Stem" },
  EarthlyBranch: { zh: "地支", en: "Earthly Branch" },
  FiveElements: { zh: "五行", en: "Five Elements / Wu Xing" },
  TenGods: { zh: "十神", en: "Ten Gods / Shi Shen" },
  TrueSolarTime: { zh: "真太阳时", en: "True Solar Time" },
  LuckCycle: { zh: "大运", en: "Luck Cycle / Da Yun" },
} as const;

export const YISHUN_FORBIDDEN_CLAIMS = [
  "guaranteed",
  "will definitely",
  "must happen",
  "medical advice",
  "financial advice",
  "legal advice",
  "investment advice",
  "一定会",
  "必然",
  "保证",
  "医疗建议",
  "投资建议",
  "法律建议",
] as const;

export function hasForbiddenClaim(text: string) {
  const normalized = text.toLowerCase();
  return YISHUN_FORBIDDEN_CLAIMS.some((term) => normalized.includes(term.toLowerCase()));
}

export function normalizeTerminology(text: string, locale: "en" | "zh") {
  if (locale === "zh") {
    return text
      .replace(/Bazi/g, "BaZi")
      .replace(/Four Pillars of Destiny/g, "四柱")
      .replace(/Four Pillars/g, "四柱")
      .replace(/Day Master/g, "日主")
      .replace(/Heavenly Stems?/g, "天干")
      .replace(/Earthly Branches?/g, "地支")
      .replace(/Five Elements|Wu Xing/g, "五行")
      .replace(/Ten Gods|Shi Shen/g, "十神")
      .replace(/True Solar Time/g, "真太阳时");
  }

  return text
    .replace(/Ba Zi/g, "BaZi")
    .replace(/Four Pillars of Destiny/g, "Four Pillars")
    .replace(/Wu Xing/g, "Five Elements / Wu Xing")
    .replace(/Shi Shen/g, "Ten Gods / Shi Shen");
}
