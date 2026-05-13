"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useI18n } from "./LocaleProvider";
import type { FourPillarsResult, PillarInfo, BaziInterpretation } from "@/lib/bazi";
import { generateInterpretation } from "@/lib/bazi";

const STEM_CH: Record<string, string> = {
  Jia: "甲",
  Yi: "乙",
  Bing: "丙",
  Ding: "丁",
  Wu: "戊",
  Ji: "己",
  Geng: "庚",
  Xin: "辛",
  Ren: "壬",
  Gui: "癸",
};

const BRANCH_CH: Record<string, string> = {
  Zi: "子",
  Chou: "丑",
  Yin: "寅",
  Mao: "卯",
  Chen: "辰",
  Si: "巳",
  Wu: "午",
  Wei: "未",
  Shen: "申",
  You: "酉",
  Xu: "戌",
  Hai: "亥",
};

const ELEMENT_CH: Record<string, string> = {
  Wood: "木",
  Fire: "火",
  Earth: "土",
  Metal: "金",
  Water: "水",
};

const POLARITY_CH: Record<string, string> = {
  Yin: "阴",
  Yang: "阳",
};

const ZODIAC_CH: Record<string, string> = {
  Rat: "鼠",
  Ox: "牛",
  Tiger: "虎",
  Rabbit: "兔",
  Dragon: "龙",
  Snake: "蛇",
  Horse: "马",
  Goat: "羊",
  Monkey: "猴",
  Rooster: "鸡",
  Dog: "狗",
  Pig: "猪",
};

interface FortuneData {
  todayOverview: string;
  luckyNumber: number;
  luckyColor: string;
  luckyTime: string;
  career: string;
  love: string;
  wealth: string;
  health: string;
  advice: string;
}

interface FortuneCardProps {
  fortune: FortuneData;
  bazi?: FourPillarsResult | null;
  onReset: () => void;
}

function InterpretationSection({ bazi }: { bazi: FourPillarsResult }) {
  const { t, locale } = useI18n();
  const interpretation = locale === "zh-CN" ? generateInterpretation(bazi, "zh") : generateInterpretation(bazi, "en");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl border border-white/5 bg-surface/40 p-4 text-sm text-gray-300 mt-4 space-y-4"
    >
      <div className="text-xs uppercase tracking-[0.24em] text-gray-400">
        {t("fortuneCard.interpretation") || "Interpretation"}
      </div>
      
      <div className="space-y-2">
        <h4 className="text-white font-medium">{t("fortuneCard.dayMasterAnalysis")}</h4>
        <p className="text-gray-400 text-xs">{interpretation.dayMasterDescription}</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-white font-medium">{t("fortuneCard.seasonAnalysis")}</h4>
        <p className="text-gray-400 text-xs">{interpretation.monthSeasonDescription}</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-white font-medium">{t("fortuneCard.strengthAnalysis")}</h4>
        <p className="text-gray-400 text-xs">{interpretation.strengthAnalysis}</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-white font-medium">{t("fortuneCard.favorableElements")}</h4>
        <div className="flex gap-2 flex-wrap">
          {interpretation.favorableElements.map(el => (
            <span key={el} className="px-2 py-1 bg-white/5 rounded text-xs text-secondary border border-white/10">
              {el}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PillarDisplay({ pillar, label, locale }: { pillar: PillarInfo; label: string; locale: string }) {
  const stemName = locale === "zh-CN" ? (STEM_CH[pillar.stem.name] ?? pillar.stem.name) : pillar.stem.name;
  const branchName = locale === "zh-CN" ? (BRANCH_CH[pillar.branch.name] ?? pillar.branch.name) : pillar.branch.name;
  const tenGod = pillar.stemTenGod ? (locale === "zh-CN" ? pillar.stemTenGod.split(" / ")[1] : pillar.stemTenGod.split(" / ")[0]) : "";

  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-white/5 rounded-lg min-w-[80px]">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      
      {/* Stem Ten God */}
      <span className="text-[10px] text-secondary/80 h-4">{tenGod}</span>
      
      {/* Pillar */}
      <div className="flex flex-col items-center my-1">
        <span className={`text-lg font-bold ${
          pillar.stem.element === 'Fire' ? 'text-red-400' :
          pillar.stem.element === 'Water' ? 'text-blue-400' :
          pillar.stem.element === 'Wood' ? 'text-green-400' :
          pillar.stem.element === 'Metal' ? 'text-yellow-400' :
          'text-amber-700'
        }`}>{stemName}</span>
        <span className={`text-lg font-bold ${
          // Simple element mapping for branches is harder without exact data, 
          // but we can use default text color or try to map if we had branch elements exposed.
          'text-white'
        }`}>{branchName}</span>
      </div>

      {/* Hidden Stems */}
      <div className="flex flex-col gap-0.5 w-full">
        {pillar.branchHiddenStems?.map((hidden, idx) => {
           const hiddenName = locale === "zh-CN" ? (STEM_CH[hidden.stem.name] ?? hidden.stem.name) : hidden.stem.name;
           const hiddenGod = hidden.tenGod ? (locale === "zh-CN" ? hidden.tenGod.split(" / ")[1] : hidden.tenGod.split(" / ")[0]) : "";
           // Simplify hidden god name
           const simpleHiddenGod = hiddenGod.split(" (")[0]; 
           return (
             <div key={idx} className="flex justify-between text-[8px] text-gray-500 w-full px-1">
               <span>{hiddenName}</span>
               <span className="scale-90 origin-right">{simpleHiddenGod}</span>
             </div>
           )
        })}
      </div>
    </div>
  );
}

export default function FortuneCard({ fortune, bazi, onReset }: FortuneCardProps) {
  const { t, locale } = useI18n();
  const [displayNumber, setDisplayNumber] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayNumber(fortune.luckyNumber);
    }, 500);
    return () => clearTimeout(timeout);
  }, [fortune.luckyNumber]);

  const categories = [
    {
      icon: "💼",
      title: t("fortuneCard.career"),
      content: fortune.career,
      delay: 0.4,
    },
    {
      icon: "💕",
      title: t("fortuneCard.love"),
      content: fortune.love,
      delay: 0.5,
    },
    {
      icon: "💰",
      title: t("fortuneCard.wealth"),
      content: fortune.wealth,
      delay: 0.6,
    },
    {
      icon: "❤️",
      title: t("fortuneCard.health"),
      content: fortune.health,
      delay: 0.7,
    },
  ];

  const formatDayMaster = () => {
    if (!bazi) {
      return null;
    }
    const { stem } = bazi.fourPillars.day;
    if (locale === "zh-CN") {
      const stemName = STEM_CH[stem.name] ?? stem.name;
      const element = ELEMENT_CH[stem.element] ?? stem.element;
      const polarity = POLARITY_CH[stem.polarity] ?? stem.polarity;
      return `${stemName}（${polarity}${element}）`;
    }
    return `${stem.name} (${stem.polarity} ${stem.element})`;
  };

  const formatYearZodiac = () => {
    if (!bazi) {
      return null;
    }
    const zodiac = bazi.fourPillars.year.branch.zodiac;
    if (locale === "zh-CN") {
      return ZODIAC_CH[zodiac] ?? zodiac;
    }
    return zodiac;
  };

  const formatFourPillars = () => {
    if (!bazi) {
      return null;
    }
    
    // Use new PillarDisplay component structure
    return (
      <div className="grid grid-cols-4 gap-2 w-full mt-2">
        <PillarDisplay pillar={bazi.fourPillars.year} label={t("fortuneCard.year") || "Year"} locale={locale} />
        <PillarDisplay pillar={bazi.fourPillars.month} label={t("fortuneCard.month") || "Month"} locale={locale} />
        <PillarDisplay pillar={bazi.fourPillars.day} label={t("fortuneCard.day") || "Day"} locale={locale} />
        <PillarDisplay pillar={bazi.fourPillars.hour} label={t("fortuneCard.hour") || "Hour"} locale={locale} />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass card p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl font-heading font-bold text-white mb-2">
            ✨ {t("fortuneCard.title")}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-4"
        >
          <p className="text-gray-200 leading-relaxed">
            {fortune.todayOverview}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="py-6"
        >
          <div className="text-center text-xs uppercase tracking-[0.24em] text-gray-400 mb-4">
            {t("fortuneCard.baziSignal")}
          </div>
          <p className="text-xs text-gray-500 text-center mb-6">
            {t("fortuneCard.baziBased")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.div
              className="relative"
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/80 to-secondary/70 flex items-center justify-center shadow-[0_0_18px_rgba(194,160,103,0.28)]">
                <span className="text-3xl font-bold text-[#f6f0e0]">
                  {displayNumber || fortune.luckyNumber}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-2 text-center">
                {t("fortuneCard.luckyNumberLabel")}
              </div>
            </motion.div>

            <div className="space-y-3 text-sm text-gray-300 w-full sm:w-auto">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">{t("fortuneCard.luckyColorLabel")}</span>
                <span className="text-white">{fortune.luckyColor}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">{t("fortuneCard.luckyTimeLabel")}</span>
                <span className="text-white">{fortune.luckyTime}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {bazi && (
          <div className="rounded-xl border border-white/5 bg-surface/40 px-4 py-4 text-sm text-gray-300">
            <div className="text-xs uppercase tracking-[0.24em] text-gray-400">
              {t("fortuneCard.baziSnapshot")}
            </div>
            
            {/* New Four Pillars Layout */}
            <div className="mt-4">
               {formatFourPillars()}
            </div>

            {/* True Solar Time Info if available */}
            {bazi.trueSolarTime && (
              <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>{t("baziChart.field.trueSolarTime")}:</span>
                  <span className="text-gray-300">{bazi.trueSolarTime.time}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>{t("baziChart.equationOfTime")}:</span>
                  <span>{bazi.trueSolarTime.equationOfTimeMinutes}m</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>{t("baziChart.longitudeCorrection")}:</span>
                  <span>{bazi.trueSolarTime.longitudeCorrectionMinutes}m</span>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">{t("fortuneCard.dayMaster")}</span>
                <span className="text-white">{formatDayMaster()}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">{t("fortuneCard.yearZodiac")}</span>
                <span className="text-white">{formatYearZodiac()}</span>
              </div>
            </div>
          </div>
        )}

        {/* New Interpretation Section */}
        {bazi && <InterpretationSection bazi={bazi} />}

        <div className="space-y-4 pt-4 border-t border-white/10">
          {categories.map((cat) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: cat.delay + 0.2 }}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <span className="text-2xl">{cat.icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-secondary mb-1">
                  {cat.title}
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {cat.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="pt-4 border-t border-white/10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary text-sm mb-3">
            <span>🌟</span>
            <span>{t("fortuneCard.wisdom")}</span>
          </div>
          <p className="text-gray-200 italic">&quot;{fortune.advice}&quot;</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="pt-4"
        >
          <button
            onClick={onReset}
            className="w-full py-3 rounded-xl bg-surface/50 border border-white/10 
                     text-gray-300 hover:text-white hover:border-secondary/50 
                     transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🔄</span>
            <span>{t("fortuneCard.newReading")}</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
