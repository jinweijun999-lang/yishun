"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Background from "../components/Background";
import Navigation from "../components/Navigation";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useI18n } from "../components/LocaleProvider";
import StripeCheckoutButton from "../components/StripeCheckoutButton";

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
};

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

  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const res = await fetch("/api/consultations");
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
              {t("nav.tab.reports")}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {t("profile.history")}
            </p>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-secondary/80">Daily Ritual history</p>
                <h3 className="mt-1 text-lg font-heading font-bold text-white">Your recent timing signals</h3>
              </div>
              <a href="/reading/start" className="rounded-full border border-secondary/30 px-3 py-1 text-xs font-semibold text-secondary hover:bg-secondary/10">
                New signal
              </a>
            </div>

            {dailyHistory.length > 0 ? (
              <div className="mt-4 space-y-3">
                {dailyHistory.map((item) => (
                  <div key={`${item.date}-${item.savedAt}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">
                          {new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">{item.focus || "General"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-heading font-bold text-secondary">{item.score}</p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">clarity</p>
                      </div>
                    </div>
                    {item.bestFor?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.bestFor.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs text-secondary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm leading-6 text-gray-400">
                No Daily Ritual history on this device yet. Generate and save today’s signal to start a streak.
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
                {t("trigger.consultation.note")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <StripeCheckoutButton
                  product="report_single"
                  className="w-full px-6 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm hover:bg-secondary transition-colors"
                >
                  Full report $4.99
                </StripeCheckoutButton>
                <a
                  href="/membership"
                  className="inline-block px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  {t("layerC.buyMore")}
                </a>
              </div>
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
