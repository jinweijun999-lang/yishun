"use client";

import { useI18n } from "./LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";

type ElementBalance = {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
};

// Accessibility-first five elements display
// Each element shows: color + symbol + text label (colorblind friendly)

const ELEMENTS = [
  {
    key: "wood" as const,
    label: "木",
    en: "Wood",
    symbol: "✿",
    color: "#10B981", // emerald
    bgClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-400",
  },
  {
    key: "fire" as const,
    label: "火",
    en: "Fire",
    symbol: "☲",
    color: "#EF4444", // red
    bgClass: "bg-red-500/20",
    borderClass: "border-red-500/30",
    textClass: "text-red-400",
  },
  {
    key: "earth" as const,
    label: "土",
    en: "Earth",
    symbol: "▲",
    color: "#F59E0B", // amber
    bgClass: "bg-amber-500/20",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
  },
  {
    key: "metal" as const,
    label: "金",
    en: "Metal",
    symbol: "○",
    color: "#94A3B8", // slate (silver)
    bgClass: "bg-slate-400/20",
    borderClass: "border-slate-400/30",
    textClass: "text-slate-300",
  },
  {
    key: "water" as const,
    label: "水",
    en: "Water",
    symbol: "☵",
    color: "#3B82F6", // blue
    bgClass: "bg-blue-500/20",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-400",
  },
];

type FiveElementsChartProps = {
  balance: ElementBalance;
  showDetails?: boolean;
};

export default function FiveElementsChart({
  balance,
  showDetails = true,
}: FiveElementsChartProps) {
  const { t, locale } = useI18n();
  const total = Object.values(balance).reduce((sum, val) => sum + val, 0);

  return (
    <div className="rounded-2xl bg-surface/50 border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
            {t("fiveElements.sectionLabel")}
          </p>
          <h3 className="text-lg font-heading font-bold text-white mt-1">
            {t("fiveElements.title")}
          </h3>
        </div>
        <span className="text-xs text-gray-500">Five Elements</span>
      </div>

      {/* Bar Chart - Horizontal */}
      <div className="space-y-3">
        {ELEMENTS.map((element) => {
          const rawValue = balance[element.key];
          const percent = total > 0 ? Math.round((rawValue / total) * 100) : 0;

          return (
            <div key={element.key} className="flex items-center gap-3">
              {/* Element Identity: symbol + color + label */}
              <div
                className={`w-10 h-10 rounded-lg ${element.bgClass} border ${element.borderClass} flex items-center justify-center flex-shrink-0`}
                title={`${element.en} (${element.label})`}
                role="img"
                aria-label={`${element.label} ${element.en}`}
              >
                <span
                  className="text-lg"
                  style={{ color: element.color }}
                  aria-hidden="true"
                >
                  {element.symbol}
                </span>
              </div>

              {/* Label */}
              <div className="w-8 flex-shrink-0">
                <span className="text-sm font-medium" style={{ color: element.color }}>
                  {element.label}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 h-6 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: element.color,
                    opacity: 0.8,
                  }}
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${element.label} ${percent}%`}
                />
              </div>

              {/* Percent + Count */}
              <div className="w-12 text-right flex-shrink-0">
                <span className="text-sm font-medium text-white">{percent}%</span>
              </div>

              {/* Count */}
              <div className="w-6 text-right flex-shrink-0">
                <span className="text-xs text-gray-500">{rawValue}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Balance Analysis */}
      {showDetails && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <AnalysisHint balance={balance} locale={locale} t={t} />
        </div>
      )}
    </div>
  );
}

function AnalysisHint({
  balance,
  locale,
  t,
}: {
  balance: ElementBalance;
  locale: string;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  // Find dominant and weak elements
  const entries = Object.entries(balance) as [keyof ElementBalance, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  const weak = sorted[sorted.length - 1];

  const dominantElement = ELEMENTS.find((e) => e.key === dominant[0]);
  const weakElement = ELEMENTS.find((e) => e.key === weak[0]);

  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4">
      <span className="text-lg" aria-hidden="true">
        💡
      </span>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
          {t("fiveElements.analysis")}
        </p>
        <p className="text-sm text-gray-200 leading-relaxed">
          {locale === "en" ? (
            <>
              Your chart is strongest in{" "}
              <span className="font-medium" style={{ color: dominantElement?.color }}>
                {dominantElement?.en}
              </span>{" "}
              ({dominantElement?.label}) and may need more{" "}
              <span className="font-medium" style={{ color: weakElement?.color }}>
                {weakElement?.en}
              </span>{" "}
              ({weakElement?.label}).
            </>
          ) : (
            <>
              您的命盘{" "}
              <span className="font-medium" style={{ color: dominantElement?.color }}>
                {dominantElement?.label}
              </span>{" "}
              ({dominantElement?.en}) 较旺，建议补充{" "}
              <span className="font-medium" style={{ color: weakElement?.color }}>
                {weakElement?.label}
              </span>{" "}
              ({weakElement?.en}) 能量。
            </>
          )}
        </p>
      </div>
    </div>
  );
}
