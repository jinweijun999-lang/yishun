"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Background from "./components/Background";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Navigation from "./components/Navigation";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import { useI18n } from "./components/LocaleProvider";

type ProfileData = {
  email: string;
  birthDate: string | null;
  birthTime: string | null;
  gender: string | null;
  planTier?: string | null;
  consultationCredits?: number | null;
};

type CachedPreview = {
  dailySignal: {
    score: number;
    bestFor: string[];
    do: string;
    avoid: string;
    bestHour: string;
    luckyElement: string;
    luckyDirection: string;
  };
  dominantElement: string;
  focus?: string;
};

function hasSessionCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((item) => item.startsWith("fortune_session="));
}

function track(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.info("[YiShun funnel]", event, properties);
  window.dispatchEvent(new CustomEvent("yishun:analytics", { detail: { event, properties } }));
}


const zhValueMap: Record<string, string> = {
  General: "综合",
  Work: "事业",
  Money: "财务",
  Love: "情感",
  Energy: "能量",
  Creativity: "创意",
  Wood: "木",
  Fire: "火",
  Earth: "土",
  Metal: "金",
  Water: "水",
  East: "东方",
  South: "南方",
  "Center / Northeast": "中宫 / 东北",
  West: "西方",
  North: "北方",
  planning: "规划",
  learning: "学习",
  "slow decisions": "慢决策",
  presenting: "表达展示",
  "creative momentum": "创意推进",
  "warm outreach": "温和沟通",
  "reviewing details": "复核细节",
  budgeting: "预算安排",
  "stable commitments": "稳定承诺",
  prioritizing: "确定优先级",
  "negotiating boundaries": "协商边界",
  "focused execution": "专注执行",
  research: "调研",
  reflection: "反思",
  "sensitive conversations": "敏感沟通",
  "focused outreach": "专注沟通",
  "calm decisions": "冷静决策",
  "planning · focused outreach": "规划 · 专注沟通",
  "Choose one meaningful push and write the next step before you commit.": "选择一个最重要的推进点，并在承诺前写下下一步。",
  "Do not force a final answer before the options are clear.": "选项还不清楚前，不要强行给出最终答案。",
};

function localizeValue(value: string | undefined, isZh: boolean) {
  if (!value) return isZh ? "综合" : "General";
  if (!isZh) return value;
  return zhValueMap[value] ?? value;
}

function localizeList(values: string[], isZh: boolean) {
  return values.map((value) => localizeValue(value, isZh));
}

function localizeActionText(value: string, isZh: boolean) {
  if (!isZh) return value;
  if (zhValueMap[value]) return zhValueMap[value];
  const element = Object.keys(zhValueMap).find((key) => value.includes(`Borrow ${key} energy`));
  if (element) {
    const actionMap: Record<string, string> = {
      Wood: "借用木的能量：先写下下一步，再做承诺。",
      Fire: "借用火的能量：清楚表达一个重点，不要过度解释。",
      Earth: "借用土的能量：选择更稳定的方案，并确认关键细节。",
      Metal: "借用金的能量：开始新事前，先砍掉一个不必要任务。",
      Water: "借用水的能量：回复重要消息前，先暂停十分钟。",
    };
    return actionMap[element] ?? value;
  }
  const avoidMap: Record<string, string> = {
    "forcing a final answer before the options have room to grow": "选项还没充分展开前，不要强迫自己立刻定案。",
    "reacting quickly just to keep the energy high": "不要为了维持热度而仓促反应。",
    "saying yes to vague plans without confirming the ground rules": "规则没确认前，不要答应模糊计划。",
    "cutting off a useful option because it is not perfect yet": "不要因为还不完美就砍掉有用选项。",
    "over-reading signals without choosing one small next step": "不要过度解读信号，却不选择一个小行动。",
  };
  return avoidMap[value] ?? value;
}

const sampleSignal: CachedPreview = {
  focus: "General",
  dominantElement: "Wood",
  dailySignal: {
    score: 82,
    bestFor: ["planning", "focused outreach", "calm decisions"],
    do: "Choose one meaningful push and write the next step before you commit.",
    avoid: "Do not force a final answer before the options are clear.",
    bestHour: "07:00–09:00",
    luckyElement: "Wood",
    luckyDirection: "East",
  },
};

export default function Home() {
  const { t, locale } = useI18n();
  const isZh = locale === "zh-CN";
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cachedPreview, setCachedPreview] = useState<CachedPreview | null>(null);
  const [completedDate, setCompletedDate] = useState<string | null>(null);

  useEffect(() => {
    window.setTimeout(() => {
      try {
        const cached = window.localStorage.getItem("yishun:p0Preview");
        setCachedPreview(cached ? (JSON.parse(cached) as CachedPreview) : null);
        setCompletedDate(window.localStorage.getItem("yishun:dailyRitual:completedDate"));
      } catch {
        setCachedPreview(null);
      }
    }, 0);

    const loadProfile = async () => {
      if (!hasSessionCookie()) {
        setAuthChecked(true);
        return;
      }
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        }
      } finally {
        setAuthChecked(true);
      }
    };
    loadProfile();

  }, []);

  const isLoggedIn = !!profile;
  const activeSignal = cachedPreview ?? sampleSignal;
  const displaySignal = {
    focus: localizeValue(activeSignal.focus, isZh),
    bestFor: localizeList(activeSignal.dailySignal.bestFor, isZh),
    luckyElement: localizeValue(activeSignal.dailySignal.luckyElement, isZh),
    luckyDirection: localizeValue(activeSignal.dailySignal.luckyDirection, isZh),
    do: localizeActionText(activeSignal.dailySignal.do, isZh),
    avoid: localizeActionText(activeSignal.dailySignal.avoid, isZh),
  };
  const hasSavedRitual = Boolean(cachedPreview);
  const today = new Date().toISOString().slice(0, 10);
  const completedToday = completedDate === today;

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-24">
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl" role="img" aria-hidden="true">🔮</span>
              <h1 className="text-lg font-heading font-bold text-white">
                YiShun <span className="text-accent text-sm">{isZh ? "易顺" : ""}</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {authChecked && (isLoggedIn ? (
                <a href="/profile" className="text-xs text-secondary hover:text-secondary/80 transition-colors">
                  {t("nav.profile")}
                </a>
              ) : (
                <a href="/login" className="text-xs text-secondary hover:text-secondary/80 transition-colors">
                  {t("nav.login")}
                </a>
              ))}
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-lg gap-6 px-4 py-6 lg:max-w-5xl lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            {isLoggedIn && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{t("nav.signedInAs", { email: profile.email })}</span>
                {profile.planTier && profile.planTier !== "free" && (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent">
                    {profile.planTier}
                  </span>
                )}
              </div>
            )}

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-secondary/20 bg-gradient-to-br from-secondary/15 via-surface/80 to-accent/10 p-6 shadow-2xl"
            >
              <p className="text-[10px] uppercase tracking-[0.28em] text-accent/80">
                {t("home.ritual.subtitle")}
              </p>
              <h2 className="mt-3 text-3xl font-heading font-bold text-white text-glow">
                {t("home.ritual.title")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-300">
                {t("home.ritual.description")}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href={hasSavedRitual ? "/reading/result" : "/reading/start"}
                  onClick={() => track(hasSavedRitual ? "open_today_ritual_click" : "start_daily_signal_click", { source: "home" })}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-bold text-white shadow-lg hover:opacity-95"
                >
                  {hasSavedRitual ? t("home.ritual.open") : t("home.ritual.start")}
                </Link>
                <Link
                  href="/tools/sample"
                  onClick={() => track("sample_result_click", { source: "home" })}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-4 text-sm font-semibold text-gray-200 hover:bg-white/5"
                >
                  {t("home.ritual.sample")}
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-gray-500">
                {t("home.ritual.disclaimer")}
              </p>
            </motion.section>

            <PwaInstallPrompt />
          </div>

          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-surface/70 p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-secondary/80">
                    {hasSavedRitual ? t("home.ritual.yourRitual") : t("home.ritual.sampleRitual")}
                  </p>
                  <h3 className="mt-2 text-2xl font-heading font-bold text-white">
                    {activeSignal.dailySignal.score} / 100 {t("home.ritual.timingClarity")}
                  </h3>
                </div>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
                  {completedToday ? t("todayFortune.completed") : displaySignal.focus}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-gray-500">{t("home.ritual.bestFor")}</p>
                  <p className="mt-1 text-white font-semibold">{displaySignal.bestFor.slice(0, 2).join(" · ")}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-gray-500">{t("home.ritual.goldenHour")}</p>
                  <p className="mt-1 text-white font-semibold">{activeSignal.dailySignal.bestHour}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-gray-500">{t("home.ritual.luckyElement")}</p>
                  <p className="mt-1 text-white font-semibold">{displaySignal.luckyElement}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-gray-500">{t("home.ritual.luckyDirection")}</p>
                  <p className="mt-1 text-white font-semibold">{displaySignal.luckyDirection}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
                <p className="text-xs font-bold uppercase text-secondary">{t("home.ritual.do")}</p>
                <p className="mt-2 text-sm leading-6 text-gray-200">{displaySignal.do}</p>
              </div>
              <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
                <p className="text-xs font-bold uppercase text-accent">{t("home.ritual.avoid")}</p>
                <p className="mt-2 text-sm leading-6 text-gray-200">{displaySignal.avoid}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={hasSavedRitual ? "/reading/result" : "/reading/start"} className="rounded-xl bg-secondary/80 px-4 py-3 text-sm font-semibold text-white hover:bg-secondary">
                  {hasSavedRitual ? t("home.ritual.open") : t("home.ritual.create")}
                </Link>
                <Link href="/reports" className="rounded-xl border border-white/20 px-4 py-3 text-sm text-gray-300 hover:bg-white/5">
                  {t("home.ritual.viewHistory")}
                </Link>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-surface/60 border border-white/10 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-secondary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg" role="img" aria-hidden="true">📚</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-accent/80 mb-1">{t("home.baziBasics.sectionTitle")}</p>
                  <h3 className="text-base font-heading font-bold text-white">{t("home.baziBasics.title")}</h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {t("home.baziBasics.description")}
                  </p>
                  <a href="/learn/bazi-basics" className="inline-block mt-3 text-xs text-secondary hover:text-secondary/80 transition-colors">
                    {t("home.baziBasics.link")}
                  </a>
                </div>
              </div>
            </motion.section>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center pt-4"
            >
              <p className="text-xs text-gray-600">🔮 {t("common.poweredBy")}</p>
              <p className="text-xs text-gray-700 mt-1">{t("common.disclaimer")}</p>
            </motion.div>
          </div>
        </div>

        <Navigation />
      </main>
    </>
  );
}
