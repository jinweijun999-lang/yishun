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

function track(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.info("[YiShun funnel]", event, properties);
  window.dispatchEvent(new CustomEvent("yishun:analytics", { detail: { event, properties } }));
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
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cachedPreview] = useState<CachedPreview | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = window.localStorage.getItem("yishun:p0Preview");
      return cached ? (JSON.parse(cached) as CachedPreview) : null;
    } catch {
      return null;
    }
  });
  const [completedDate] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("yishun:dailyRitual:completedDate");
  });

  useEffect(() => {
    const loadProfile = async () => {
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
                YiShun <span className="text-accent text-sm">易顺</span>
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
                60-second Eastern timing ritual
              </p>
              <h2 className="mt-3 text-3xl font-heading font-bold text-white text-glow">
                What should you lean into today?
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-300">
                YiShun turns your birth moment into a daily decision signal: what to push, what to pause, and why — without fear-based predictions.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href={hasSavedRitual ? "/reading/result" : "/reading/start"}
                  onClick={() => track(hasSavedRitual ? "open_today_ritual_click" : "start_daily_signal_click", { source: "home" })}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-bold text-white shadow-lg hover:opacity-95"
                >
                  {hasSavedRitual ? "Open today’s ritual" : "Start my free daily signal"}
                </Link>
                <Link
                  href="/tools/sample"
                  onClick={() => track("sample_result_click", { source: "home" })}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-4 text-sm font-semibold text-gray-200 hover:bg-white/5"
                >
                  See sample result
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-gray-500">
                Entertainment and self-reflection only. No medical, legal, financial, or life-critical advice.
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
                    {hasSavedRitual ? "Your Daily Ritual" : "Sample Daily Ritual"}
                  </p>
                  <h3 className="mt-2 text-2xl font-heading font-bold text-white">
                    {activeSignal.dailySignal.score} / 100 timing clarity
                  </h3>
                </div>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
                  {completedToday ? "Completed today" : activeSignal.focus ?? "General"}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-gray-500">Best for</p>
                  <p className="mt-1 text-white font-semibold">{activeSignal.dailySignal.bestFor.slice(0, 2).join(" · ")}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-gray-500">Golden hour</p>
                  <p className="mt-1 text-white font-semibold">{activeSignal.dailySignal.bestHour}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-gray-500">Element</p>
                  <p className="mt-1 text-white font-semibold">{activeSignal.dailySignal.luckyElement}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs text-gray-500">Direction</p>
                  <p className="mt-1 text-white font-semibold">{activeSignal.dailySignal.luckyDirection}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
                <p className="text-xs font-bold uppercase text-secondary">Do</p>
                <p className="mt-2 text-sm leading-6 text-gray-200">{activeSignal.dailySignal.do}</p>
              </div>
              <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
                <p className="text-xs font-bold uppercase text-accent">Avoid</p>
                <p className="mt-2 text-sm leading-6 text-gray-200">{activeSignal.dailySignal.avoid}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={hasSavedRitual ? "/reading/result" : "/reading/start"} className="rounded-xl bg-secondary/80 px-4 py-3 text-sm font-semibold text-white hover:bg-secondary">
                  {hasSavedRitual ? "Open Today’s Ritual" : "Create your signal"}
                </Link>
                <Link href="/reports" className="rounded-xl border border-white/20 px-4 py-3 text-sm text-gray-300 hover:bg-white/5">
                  View history
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
                  <p className="text-[10px] uppercase tracking-wider text-accent/80 mb-1">BA ZI BASICS</p>
                  <h3 className="text-base font-heading font-bold text-white">Why a daily ritual?</h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    YiShun combines your Four Pillars, Five Elements, true solar time, and today’s cycle into practical reflection prompts.
                  </p>
                  <a href="/learn/bazi-basics" className="inline-block mt-3 text-xs text-secondary hover:text-secondary/80 transition-colors">
                    Learn more →
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
