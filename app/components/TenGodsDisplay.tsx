"use client";

import { useI18n } from "./LocaleProvider";

// Ten Gods mapping (Ten Divine Spirits / Ten Stars)
// Each god has: name, symbol, polarity, element, color

type TenGod = {
  key: string;
  stemKey: string; // Jia, Yi, Bing, etc.
  labelZh: string;
  labelEn: string;
  symbol: string;
  polarity: "Yang" | "Yin";
  element: "Wood" | "Fire" | "Earth" | "Metal" | "Water";
  nature: "supportive" | "challenging";
  color: string;
};

const TEN_GODS: TenGod[] = [
  {
    key: "比肩",
    stemKey: "Jia",
    labelZh: "比肩",
    labelEn: "Comparion",
    symbol: "🤝",
    polarity: "Yang",
    element: "Wood",
    nature: "supportive",
    color: "#10B981",
  },
  {
    key: "劫财",
    stemKey: "Yi",
    labelZh: "劫财",
    labelEn: "Robbery",
    symbol: "⚔",
    polarity: "Yin",
    element: "Wood",
    nature: "challenging",
    color: "#10B981",
  },
  {
    key: "食神",
    stemKey: "Bing",
    labelZh: "食神",
    labelEn: "Food God",
    symbol: "🍽",
    polarity: "Yang",
    element: "Fire",
    nature: "supportive",
    color: "#EF4444",
  },
  {
    key: "伤官",
    stemKey: "Ding",
    labelZh: "伤官",
    labelEn: "Hurt Officer",
    symbol: "⚔",
    polarity: "Yin",
    element: "Fire",
    nature: "challenging",
    color: "#EF4444",
  },
  {
    key: "偏财",
    stemKey: "Wu",
    labelZh: "偏财",
    labelEn: "Partial Wealth",
    symbol: "💰",
    polarity: "Yang",
    element: "Earth",
    nature: "supportive",
    color: "#F59E0B",
  },
  {
    key: "正财",
    stemKey: "Ji",
    labelZh: "正财",
    labelEn: "Right Wealth",
    symbol: "💵",
    polarity: "Yin",
    element: "Earth",
    nature: "supportive",
    color: "#F59E0B",
  },
  {
    key: "七杀",
    stemKey: "Geng",
    labelZh: "七杀",
    labelEn: "Seven Killings",
    symbol: "⚔",
    polarity: "Yang",
    element: "Metal",
    nature: "challenging",
    color: "#94A3B8",
  },
  {
    key: "正官",
    stemKey: "Xin",
    labelZh: "正官",
    labelEn: "Official",
    symbol: "📋",
    polarity: "Yin",
    element: "Metal",
    nature: "supportive",
    color: "#94A3B8",
  },
  {
    key: "偏印",
    stemKey: "Ren",
    labelZh: "偏印",
    labelEn: "Partial Seal",
    symbol: "🔮",
    polarity: "Yang",
    element: "Water",
    nature: "challenging",
    color: "#3B82F6",
  },
  {
    key: "正印",
    stemKey: "Gui",
    labelZh: "正印",
    labelEn: "Right Seal",
    symbol: "📜",
    polarity: "Yin",
    element: "Water",
    nature: "supportive",
    color: "#3B82F6",
  },
];

type TenGodsDisplayProps = {
  dayMasterStem: string;
  pillars?: {
    year?: string;
    month?: string;
    day?: string;
    hour?: string;
  };
  isLocked?: boolean;
};

export default function TenGodsDisplay({
  dayMasterStem,
  pillars,
  isLocked = false,
}: TenGodsDisplayProps) {
  const { t, locale } = useI18n();

  if (isLocked) {
    return (
      <div className="rounded-2xl bg-surface/50 border border-white/10 p-5 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl" role="img" aria-hidden="true">
            🔒
          </span>
        </div>
        <h3 className="text-lg font-heading font-bold text-white">
          {t("tenGods.lockedTitle")}
        </h3>
        <p className="text-xs text-gray-400 mt-2">{t("tenGods.lockedDesc")}</p>
        <a
          href="/membership"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-colors"
        >
          {t("tenGods.unlockBtn")}
        </a>
      </div>
    );
  }

  // Find the day master stem to show related ten gods
  const dayMasterGods = TEN_GODS.filter((god) => god.stemKey === dayMasterStem);

  return (
    <div className="rounded-2xl bg-surface/50 border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
            {t("tenGods.sectionLabel")}
          </p>
          <h3 className="text-lg font-heading font-bold text-white mt-1">
            {t("tenGods.title")}
          </h3>
        </div>
        <span className="text-xs text-gray-500">Ten Gods</span>
      </div>

      {/* Day Master Info */}
      <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          {t("tenGods.dayMaster")}
        </p>
        <p className="text-sm text-white font-medium mt-1">
          {dayMasterStem} — {dayMasterGods[0]?.labelZh || dayMasterStem}
        </p>
      </div>

      {/* Ten Gods Grid */}
      <div className="grid grid-cols-5 gap-2">
        {TEN_GODS.map((god) => {
          const isActive =
            dayMasterGods.some((d) => d.key === god.key) ||
            god.stemKey === dayMasterStem;

          return (
            <div
              key={god.key}
              className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                isActive
                  ? `${god.nature === "supportive" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`
                  : "bg-white/5 border-white/10 opacity-60"
              }`}
              title={`${god.labelZh} (${god.labelEn}) — ${god.polarity} ${god.element}`}
            >
              <span
                className="text-lg"
                role="img"
                aria-label={`${god.labelZh}`}
                aria-hidden="true"
              >
                {god.symbol}
              </span>
              <span
                className="text-[10px] font-medium mt-1"
                style={{ color: isActive ? god.color : "#6b7280" }}
              >
                {locale === "en" ? god.labelEn.slice(0, 6) : god.labelZh}
              </span>
              {god.nature === "supportive" ? (
                <span className="text-[8px] text-emerald-500 mt-0.5">+</span>
              ) : (
                <span className="text-[8px] text-red-500 mt-0.5">−</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
          <span className="text-xs text-gray-400">{t("tenGods.supportive")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50" />
          <span className="text-xs text-gray-400">{t("tenGods.challenging")}</span>
        </div>
      </div>
    </div>
  );
}
