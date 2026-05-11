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

export function normalizeBirthProfileInput(raw: Record<string, unknown>): BirthProfileInput {
  const birthDate = typeof raw.birthDate === "string" ? raw.birthDate : "";
  const birthTimeKnown = raw.birthTimeKnown !== false && raw.birthTime !== null;
  const birthTime = birthTimeKnown && typeof raw.birthTime === "string" && /^\d{2}:\d{2}$/.test(raw.birthTime)
    ? raw.birthTime
    : "12:00";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("INVALID_BIRTH_DATE");
  }

  return {
    birthDate,
    birthTime,
    birthTimeKnown,
    birthPlaceText: typeof raw.birthPlaceText === "string" ? raw.birthPlaceText : null,
    longitude: parseOptionalNumber(raw.longitude),
    latitude: parseOptionalNumber(raw.latitude),
    timezoneOffsetMinutes: parseOptionalNumber(raw.timezoneOffsetMinutes),
    timezoneName: typeof raw.timezoneName === "string" ? raw.timezoneName : null,
    gender: normalizeGender(raw.gender),
    locale: raw.locale === "zh" ? "zh" : "en",
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
  const interpretation = generateInterpretation(chart);
  const balance = computeElementBalance(chart);
  const ordered = (Object.entries(balance) as Array<[keyof ElementBalance, number]>)
    .sort((a, b) => b[1] - a[1]);
  const dominantElement = ELEMENT_KEY_TO_LABEL[ordered[0][0]];
  const missingElement = ELEMENT_KEY_TO_LABEL[ordered[ordered.length - 1][0]];
  const changedHourPillar = rawChart.fourPillars.hour.pillar !== chart.fourPillars.hour.pillar;
  const changedDayBoundary = rawChart.fourPillars.day.pillar !== chart.fourPillars.day.pillar;
  const tenGodPattern = summarizeTenGodPattern(chart);

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

export function generateDailySignal(chart: FourPillarsResult, birthTimeKnown = true): DailySignal {
  const interpretation = generateInterpretation(chart);
  const balance = computeElementBalance(chart);
  const values = Object.values(balance);
  const dominant = (Object.entries(balance) as Array<[keyof ElementBalance, number]>)
    .sort((a, b) => b[1] - a[1])[0][0];
  const favorableElement = interpretation.favorableElements[0] ?? ELEMENT_KEY_TO_LABEL[dominant];
  const detail = ELEMENT_DETAILS[favorableElement] ?? ELEMENT_DETAILS.Wood;
  const daySeed = new Date().getUTCDate() + chart.fourPillars.day.stem.name.length + chart.fourPillars.month.branch.name.length;
  const score = Math.max(62, Math.min(92, 70 + (daySeed % 17) + Math.round((Math.max(...values) - Math.min(...values)) / 2)));
  const bestForByElement: Record<string, string[]> = {
    Wood: ["planning", "learning", "slow decisions"],
    Fire: ["presenting", "creative momentum", "warm outreach"],
    Earth: ["reviewing details", "budgeting", "stable commitments"],
    Metal: ["prioritizing", "negotiating boundaries", "focused execution"],
    Water: ["research", "reflection", "sensitive conversations"],
  };
  const avoidByElement: Record<string, string> = {
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

  return {
    score,
    bestFor: bestForByElement[favorableElement] ?? bestForByElement.Wood,
    do: `Borrow ${detail.label} energy: ${detail.microAction}.`,
    avoid: avoidByElement[favorableElement] ?? avoidByElement.Wood,
    bestHour: birthTimeKnown ? (hourByElement[favorableElement] ?? "09:00–11:00") : "Use as a broad day signal — birth time is unknown",
    luckyElement: detail.label,
    luckyDirection: detail.direction,
    why: `Your chart benefits from ${detail.meaning} today. The signal is based on your Day Master, Five Elements balance, Yin/Yang rhythm, and true-solar-time adjusted birth profile.`,
    deeperInsight: `The unlocked layer translates Ten Gods into user-friendly patterns. ${summarizeTenGodPattern(chart).plain}. Use this as a reflection prompt, not a fixed prediction.`,
    disclaimer: "For entertainment and self-reflection only. YiShun does not provide medical, financial, legal, or life-critical advice.",
  };
}

export function summarizeTenGodPattern(chart: FourPillarsResult) {
  const gods = [
    chart.fourPillars.year.stemTenGod,
    chart.fourPillars.month.stemTenGod,
    chart.fourPillars.hour.stemTenGod,
  ].filter(Boolean).join(" | ");
  const matchKey = Object.keys(TEN_GOD_PATTERN_LABELS).find((key) => gods.includes(key));
  return TEN_GOD_PATTERN_LABELS[matchKey ?? "Friend"] ?? TEN_GOD_PATTERN_LABELS.Friend;
}

export { ELEMENT_DETAILS };
