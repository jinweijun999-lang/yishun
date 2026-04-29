"use client";

import { useI18n } from "./LocaleProvider";

type TodayFortuneProps = {
  date?: string;
  dayTip?: string;
  luckyStars?: number;
  overallScore?: number;
};

export default function TodayFortune({
  date,
  dayTip,
  luckyStars = 3,
  overallScore = 78,
}: TodayFortuneProps) {
  const { t } = useI18n();

  const getLuckyStars = (score: number) => {
    const stars = Math.round((score / 100) * 5);
    return Array.from({ length: 5 }, (_, i) => i < stars);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface/80 to-primary/60 border border-white/10 p-6 sm:p-8">
      {/* Lucky pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L35 25L55 30L35 35L30 55L25 35L5 30L25 25Z' fill='%23C2A067' fill-opacity='0.4'/%3E%3C/svg%3E\")",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-medium">
              {t("todayFortune.label")}
            </p>
            <h2 className="text-2xl font-heading font-bold text-white mt-1 text-glow">
              {t("todayFortune.title")}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{date || new Date().toLocaleDateString()}</p>
            <div className="flex items-center gap-1 mt-1 justify-end">
              {getLuckyStars(overallScore).map((filled, i) => (
                <span
                  key={i}
                  className={`text-sm ${filled ? "text-accent" : "text-gray-600"}`}
                  aria-hidden="true"
                >
                  {filled ? "★" : "☆"}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Score Ring */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${overallScore * 2.64} 264`}
              />
              <defs>
                <linearGradient
                  id="scoreGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#6F9A84" />
                  <stop offset="100%" stopColor="#C2A067" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{overallScore}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-200 leading-relaxed">
              {dayTip || t("todayFortune.defaultTip")}
            </p>
          </div>
        </div>

        {/* Lucky elements */}
        <div className="grid grid-cols-3 gap-3">
          <LuckyItem icon="☚" label={t("todayFortune.lucky.direction")} value="East" />
          <LuckyItem icon="✿" label={t("todayFortune.lucky.element")} value="Wood" />
          <LuckyItem icon="⏰" label={t("todayFortune.lucky.time")} value="9-11am" />
        </div>
      </div>
    </div>
  );
}

function LuckyItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
      <span className="text-lg block mb-1" role="img" aria-hidden="true">
        {icon}
      </span>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white font-medium mt-1">{value}</p>
    </div>
  );
}
