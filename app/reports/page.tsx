"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Background from "../components/Background";
import Navigation from "../components/Navigation";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useI18n } from "../components/LocaleProvider";
import { queueP0Analytics } from "@/lib/p0-analytics";

type Consultation = {
  id: string;
  question: string;
  createdAt: string;
  response: {
    interpretation: string;
    action_guidance?: {
      do: string;
      avoid: string;
    };
  };
};

type DailyRitualHistoryItem = {
  date: string;
  score: number;
  bestFor: string[];
  focus: string;
  savedAt: string;
  bestHour?: string;
  avoid?: string;
  action?: string;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hasSessionCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((item) => item.startsWith("fortune_session="));
}

function calculateStreak(history: DailyRitualHistoryItem[]) {
  const dates = new Set(history.map((item) => item.date));
  let streak = 0;
  const cursor = new Date(`${todayKey()}T00:00:00`);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
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
};

const zhActionMap: Record<string, string> = {
  "Borrow Wood energy: write the next step before making a commitment.": "借用木的能量：先写下下一步，再做承诺。",
  "Borrow Fire energy: share one clear message instead of over-explaining.": "借用火的能量：清楚表达一个重点，不要过度解释。",
  "Borrow Earth energy: choose the stable option and confirm the details.": "借用土的能量：选择更稳定的方案，并确认关键细节。",
  "Borrow Metal energy: cut one unnecessary task before starting something new.": "借用金的能量：开始新事前，先砍掉一个不必要任务。",
  "Borrow Water energy: pause for ten minutes before replying to important messages.": "借用水的能量：回复重要消息前，先暂停十分钟。",
  "forcing a final answer before the options have room to grow": "选项还没充分展开前，不要强迫自己立刻定案。",
  "reacting quickly just to keep the energy high": "不要为了维持热度而仓促反应。",
  "saying yes to vague plans without confirming the ground rules": "规则没确认前，不要答应模糊计划。",
  "cutting off a useful option because it is not perfect yet": "不要因为还不完美就砍掉有用选项。",
  "over-reading signals without choosing one small next step": "不要过度解读信号，却不选择一个小行动。",
};

function localizeSavedValue(value: string | undefined, isZh: boolean) {
  if (!value) return isZh ? "综合" : "General";
  return isZh ? zhValueMap[value] ?? value : value;
}

function localizeSavedAction(value: string | undefined, isZh: boolean) {
  if (!value) return "";
  return isZh ? zhActionMap[value] ?? value : value;
}

export default function ReportsPage() {
  const router = useRouter();
  const handleBack = () => { router.back(); };
  const { t, locale } = useI18n();
  const isEnglish = locale === "en";
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dailyHistory] = useState<DailyRitualHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("yishun:dailyRitual:history");
      const parsed = saved ? (JSON.parse(saved) as DailyRitualHistoryItem[]) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 7) : [];
    } catch {
      return [];
    }
  });
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const streak = calculateStreak(dailyHistory);

  useEffect(() => {
    queueP0Analytics("reports_open", { daily_history_count: dailyHistory.length, streak, source: "reports" });
    queueP0Analytics("streak_view", { streak, source: "reports" });
  }, [dailyHistory.length, streak]);

  useEffect(() => {
    const loadConsultations = async () => {
      if (!hasSessionCookie()) {
        setConsultations([]);
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/consultations");
        if (res.status === 401) {
          setConsultations([]);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setConsultations(data.consultations);
        }
      } catch (error) {
        console.error("Failed to load consultations", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConsultations();
  }, []);

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label={t("common.goBack")}
              >
                ←
              </button>
              <span className="text-xl" role="img" aria-label="reports">📊</span>
              <h1 className="text-lg font-heading font-bold text-white">
                {isEnglish ? "YiShun" : <>YiShun <span className="text-accent text-sm">易顺</span></>}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <h2 className="text-2xl font-heading font-bold text-white text-glow">
              {t("reports.title")}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {t("reports.subtitle")}
            </p>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/15 via-surface/80 to-secondary/10 p-5"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-accent">{t("reports.returnHook")}</p>
            <div className="mt-3 grid grid-cols-[auto_1fr] gap-4 items-center">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center">
                <p className="text-4xl font-heading font-bold text-white">{streak}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">{t("reports.dayStreak")}</p>
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold text-white">{t("reports.returnTitle")}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-300">{t("reports.returnBody")}</p>
              </div>
            </div>
            <a href="/reading/start" className="mt-4 block rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-surface">{t("reports.findTiming")}</a>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-secondary/80">{t("reports.historyLabel")}</p>
                <h3 className="mt-1 text-lg font-heading font-bold text-white">{t("reports.historyTitle")}</h3>
              </div>
              <a href="/reading/start" className="rounded-full border border-secondary/30 px-3 py-1 text-xs font-semibold text-secondary hover:bg-secondary/10">
                {t("reports.newSignal")}
              </a>
            </div>

            {dailyHistory.length > 0 ? (
              <div className="mt-4 space-y-3">
                {dailyHistory.map((item) => (
                  <div key={`${item.date}-${item.savedAt}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">
                          {new Date(`${item.date}T00:00:00`).toLocaleDateString(isEnglish ? "en-US" : "zh-CN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">{localizeSavedValue(item.focus, !isEnglish) || t("reports.general")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-heading font-bold text-secondary">{item.score}</p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{t("reports.clarity")}</p>
                      </div>
                    </div>
                    {item.bestFor?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.bestFor.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs text-secondary">
                            {localizeSavedValue(tag, !isEnglish)}
                          </span>
                        ))}
                      </div>
                    )}
                    {(item.bestHour || item.action || item.avoid) && (
                      <div className="mt-3 grid gap-2 rounded-2xl bg-black/20 p-3 text-xs leading-5 text-gray-300">
                        {item.bestHour && <p><span className="text-secondary">{t("reports.bestWindow")}</span> {item.bestHour}</p>}
                        {item.action && <p><span className="text-white">{t("reports.action")}</span> {localizeSavedAction(item.action, !isEnglish)}</p>}
                        {item.avoid && <p><span className="text-accent">{t("reports.avoid")}</span> {localizeSavedAction(item.avoid, !isEnglish)}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm leading-6 text-gray-400">
                {t("reports.historyEmpty")}
              </div>
            )}
          </motion.section>

          {/* Reports List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : consultations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass card p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface/60 mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl" role="img" aria-hidden="true">📭</span>
              </div>
              <h3 className="text-base font-heading font-bold text-white mb-2">
                {t("profile.history.empty")}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {t("reports.longFormEmpty")}
              </p>
              <a
                href="/reading/start"
                className="inline-block px-6 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm hover:bg-secondary transition-colors"
              >
                {t("reports.createSignal")}
              </a>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation, index) => (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="glass card p-5 cursor-pointer hover:scale-[1.01] transition-transform duration-300"
                  onClick={() => setSelectedConsultation(consultation)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg" role="img" aria-hidden="true">💬</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        {new Date(consultation.createdAt).toLocaleDateString(isEnglish ? "en-US" : "zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-white line-clamp-2 leading-relaxed">
                        {consultation.question}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 truncate">
                        {consultation.response?.interpretation?.slice(0, 60)}...
                      </p>
                    </div>
                    <span className="text-secondary text-xs flex-shrink-0">
                      {t("profile.history.view")} →
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-4"
          >
            <p className="text-xs text-gray-600">
              {t("common.poweredBy")}
            </p>
          </motion.div>
        </div>

        {/* Consultation Detail Modal */}
        {selectedConsultation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedConsultation(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface/90 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">
                  {t("profile.history.question")}
                </h3>
                <button
                  onClick={() => setSelectedConsultation(null)}
                  className="text-gray-400 hover:text-white text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              <p className="text-white mb-6 bg-surface/60 p-4 rounded-2xl text-sm leading-relaxed">
                {selectedConsultation.question}
              </p>

              <h3 className="text-base font-bold text-white mb-3">
                {t("layerC.section.interpretation")}
              </h3>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed whitespace-pre-wrap">
                {selectedConsultation.response?.interpretation}
              </p>

              {selectedConsultation.response?.action_guidance && (
                <div className="grid gap-4 sm:grid-cols-2 mb-6">
                  <div className="bg-secondary/10 p-4 rounded-2xl border border-secondary/30">
                    <span className="text-secondary text-xs font-bold uppercase block mb-2">
                      {t("layerC.action.do")}
                    </span>
                    <p className="text-gray-300 text-sm">
                      {selectedConsultation.response.action_guidance.do}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-4 rounded-2xl border border-accent/30">
                    <span className="text-accent text-xs font-bold uppercase block mb-2">
                      {t("layerC.action.avoid")}
                    </span>
                    <p className="text-gray-300 text-sm">
                      {selectedConsultation.response.action_guidance.avoid}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-gray-600 text-center">
                  {t("layerC.result.footer")}
                </p>
              </div>

              <button
                onClick={() => setSelectedConsultation(null)}
                className="w-full mt-4 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                {t("profile.history.close")}
              </button>
            </motion.div>
          </div>
        )}

        <Navigation />
      </main>
    </>
  );
}
