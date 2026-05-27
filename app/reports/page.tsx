"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Background from "../components/Background";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AppBackLink from "../components/AppBackLink";
import PaymentValueMatrix from "../components/PaymentValueMatrix";
import YiShunBottomActionBar from "../components/YiShunBottomActionBar";
import { useI18n } from "../components/LocaleProvider";
import { queueP0Analytics } from "@/lib/p0-analytics";
import { YISHUN_EVENTS, trackYiShunEvent } from "@/lib/p1-analytics";

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

type LocalPreviewReport = {
  access?: { depth?: string; askCredits?: number; fullReportEntitlement?: { status?: string } };
  freeSummary?: { score: number; bestHour: string; do: string; avoid: string; summary: string };
  dailySignal?: { score: number; bestHour: string; do: string; avoid: string; summary?: string };
  lockedModules?: string[];
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

const reportGlossary = {
  en: [
    ["Four Pillars", "Year, month, day, and hour columns used as the chart backbone."],
    ["Day Master", "The day’s Heavenly Stem; used as the reference point for the reading."],
    ["Five Elements", "Wood, Fire, Earth, Metal, and Water balance used to describe tendencies."],
    ["True solar time", "Birth time adjusted by location before chart calculation when coordinates are available."],
  ],
  zh: [
    ["四柱", "年、月、日、时四组干支，是命盘的结构骨架。"],
    ["日主", "出生日的天干，是解读时用来定位“我”的参考点。"],
    ["五行", "木、火、土、金、水的分布，用来描述能量倾向。"],
    ["真太阳时", "有经纬度时，先按出生地校准后的出生时间。"],
  ],
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
  const { t, locale } = useI18n();
  const isEnglish = locale === "en";
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dailyHistory, setDailyHistory] = useState<DailyRitualHistoryItem[]>([]);
  const [lastPreviewReport, setLastPreviewReport] = useState<LocalPreviewReport | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedDate, setCopiedDate] = useState<string | null>(null);
  const streak = calculateStreak(dailyHistory);

  useEffect(() => {
    const loadHistory = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("yishun:dailyRitual:history");
        const parsed = saved ? (JSON.parse(saved) as DailyRitualHistoryItem[]) : [];
        setDailyHistory(Array.isArray(parsed) ? parsed.slice(0, 7) : []);
        const preview = window.localStorage.getItem("yishun:p0Preview");
        setLastPreviewReport(preview ? (JSON.parse(preview) as LocalPreviewReport) : null);
      } catch {
        setDailyHistory([]);
      }
    }, 0);
    return () => window.clearTimeout(loadHistory);
  }, []);

  useEffect(() => {
    queueP0Analytics("reports_open", { daily_history_count: dailyHistory.length, streak, source: "reports" });
    queueP0Analytics("streak_view", { streak, source: "reports" });
    trackYiShunEvent(YISHUN_EVENTS.REPORT_VIEW, { source: "reports", daily_history_count: dailyHistory.length, streak });
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

  async function copyDailySummary(item: DailyRitualHistoryItem) {
    const summary = isEnglish
      ? `YiShun daily signal ${item.date}: ${item.score}/100 · ${item.focus}. Best for ${item.bestFor.slice(0, 3).join(", ")}. Try: ${item.action ?? "one calm next step"}. For reflection only.`
      : `易顺每日信号 ${item.date}：${item.score}/100 · ${item.focus}。适合：${item.bestFor.slice(0, 3).join("、")}。建议：${item.action ?? "选择一个小行动"}。仅供娱乐和自我反思。`;
    await navigator.clipboard?.writeText(summary).catch(() => undefined);
    setCopiedDate(item.date);
    trackYiShunEvent(YISHUN_EVENTS.SHARE_CLICK, { source: "reports", mode: "copy_summary", date: item.date });
  }

  function saveLocalState() {
    window.localStorage.setItem("yishun:reports:lastSavedAt", new Date().toISOString());
    trackYiShunEvent(YISHUN_EVENTS.SAVE_CLICK, { source: "reports", mode: "save_local_state", daily_history_count: dailyHistory.length });
    setCopiedDate("local-state");
  }

  return (
    <>
      <Background />
      <main className="ys-shell relative z-10 min-h-screen pb-32 md:pb-16">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AppBackLink label={t("common.goBack")} context={isEnglish ? "Reports" : "报告"} icon="‹" />
              <h1 className="hidden text-lg font-heading font-bold text-white sm:block">
                {isEnglish ? "YiShun" : <>YiShun <span className="text-accent text-sm">易顺</span></>}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ys-panel rounded-[2rem] p-6"
          >
            <p className="ys-kicker">{isEnglish ? "Personal rhythm center" : "个人节奏中心"}</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <h2 className="text-3xl font-heading font-bold tracking-[-0.04em] text-white text-glow">
                  {isEnglish ? "Your saved signals, streak, and shareable timing cards." : "你的历史、连续记录和可分享时机卡。"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {isEnglish ? "Use this as the home base for returning tomorrow, comparing patterns, and turning a private signal into a clean public card." : "这里是每日回访中心：对比历史节奏，查看连续记录，并把私密信号转成高质感公开卡。"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center sm:min-w-56">
                <div className="ys-panel-soft rounded-3xl p-4"><p className="text-3xl font-bold text-white">{streak}</p><p className="text-[10px] uppercase tracking-[0.18em] text-accent">{t("reports.dayStreak")}</p></div>
                <div className="ys-panel-soft rounded-3xl p-4"><p className="text-3xl font-bold text-white">{dailyHistory.length}</p><p className="text-[10px] uppercase tracking-[0.18em] text-secondary">{isEnglish ? "Saved" : "已保存"}</p></div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Link href="/reading/start" className="ys-cta px-4 py-3 text-sm">{t("reports.findTiming")}</Link>
              <Link href="/samples" className="ys-secondary-cta px-4 py-3 text-sm">{isEnglish ? "Open samples" : "查看样例"}</Link>
              <button onClick={saveLocalState} className="ys-secondary-cta px-4 py-3 text-sm">{copiedDate === "local-state" ? (isEnglish ? "Saved locally" : "已本地保存") : (isEnglish ? "Save state" : "保存状态")}</button>
            </div>
          </motion.div>

          <PaymentValueMatrix isEnglish={isEnglish} compact source="reports" />

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.035 }}
            className="ys-panel rounded-3xl p-5"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-[#e0bd72]">{isEnglish ? "Report access" : "报告权益"}</p>
            <h3 className="mt-2 text-xl font-heading font-bold text-white">
              {lastPreviewReport?.access?.depth === "full_report" ? (isEnglish ? "Full report unlocked" : "完整报告已解锁") : (isEnglish ? "Latest item is a free teaser" : "最近一份是免费摘要")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              {isEnglish ? "Reports are split into Free teasers, Full Reports, and AI question records. Ask credits only power AI questions and never unlock the full report." : "报告页区分免费摘要、完整报告和 AI 问事记录；问事次数只用于问答，不会解锁完整报告。"}
            </p>
            {lastPreviewReport ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{isEnglish ? "Latest timing result" : "最近时机结果"}</p>
                    <p className="mt-1 text-xs text-gray-400">{(lastPreviewReport.freeSummary ?? lastPreviewReport.dailySignal)?.summary ?? (isEnglish ? "Summary saved locally." : "摘要已保存在本地。")}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {(lastPreviewReport.freeSummary ?? lastPreviewReport.dailySignal)?.score ?? "—"}/100
                  </span>
                </div>
                {lastPreviewReport.access?.depth !== "full_report" ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {(lastPreviewReport.lockedModules ?? ["four_pillars", "ten_gods", "five_elements", "deep_daily_signal"]).slice(0, 4).map((module) => (
                      <span key={module} className="rounded-full border border-[#e0bd72]/20 bg-[#e0bd72]/10 px-3 py-1 text-[#e0bd72]">🔒 {module.replaceAll("_", " ")}</span>
                    ))}
                    <Link href="/reading/result?source=reports_unlock" className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-secondary">
                      {isEnglish ? "Unlock full report" : "解锁完整报告"}
                    </Link>
                  </div>
                ) : (
                  <Link href="/reading/result?source=reports_full" className="mt-3 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    {isEnglish ? "Open unlocked modules" : "打开已解锁模块"}
                  </Link>
                )}
              </div>
            ) : null}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="ys-panel rounded-3xl p-5"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-secondary/90">{t("reports.valueLabel")}</p>
            <h3 className="mt-2 text-xl font-heading font-bold text-white">{t("reports.valueTitle")}</h3>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {([
                "reports.summaryBlock",
                "reports.actionsBlock",
                "reports.fitAvoidBlock",
                "reports.evidenceBlock",
                "reports.nextStepBlock",
                "reports.disclaimerBlock",
              ] as const).map((key) => (
                <div key={key} className="min-h-[56px] rounded-2xl border border-white/10 bg-black/20 p-3 text-gray-200">
                  {t(key)}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-400">{t("reports.valueDisclaimer")}</p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="ys-panel rounded-3xl p-5"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-[#a8d8bd]">{isEnglish ? "Plain-language glossary" : "普通用户术语说明"}</p>
            <h3 className="mt-2 text-xl font-heading font-bold text-white">{isEnglish ? "Professional terms, explained before they appear" : "专业术语先解释，再阅读报告"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(isEnglish ? reportGlossary.en : reportGlossary.zh).map(([term, explanation]) => (
                <div key={term} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-bold text-white">{term}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">{explanation}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-500">
              {isEnglish ? "YiShun uses these terms as calculation labels, not deterministic fate claims." : "易顺把这些术语作为计算标签使用，不把它们包装成宿命判断。"}
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="ys-panel rounded-3xl p-5"
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
            className="ys-panel rounded-3xl p-5"
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
                    <div className="flex flex-wrap items-start justify-between gap-3">
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => void copyDailySummary(item)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5">
                        {copiedDate === item.date ? (isEnglish ? "Copied" : "已复制") : (isEnglish ? "Copy share summary" : "复制分享摘要")}
                      </button>
                      <a href={`/s/shr_sample_${encodeURIComponent(item.date.replace(/-/g, ""))}`} className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs text-secondary hover:bg-secondary/20">
                        {isEnglish ? "Preview share page" : "预览分享页"}
                      </a>
                    </div>
                  </div>
                ))}
                <button onClick={saveLocalState} className="w-full rounded-2xl border border-white/15 px-4 py-3 text-sm text-gray-200 hover:bg-white/5">
                  {copiedDate === "local-state" ? (isEnglish ? "Local state saved" : "本地状态已保存") : (isEnglish ? "Save report state locally" : "保存报告本地状态")}
                </button>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/reading/start"
                  className="inline-block px-6 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm hover:bg-secondary transition-colors"
                >
                  {t("reports.createSignal")}
                </a>
                <Link
                  href="/samples"
                  className="inline-block px-6 py-3 rounded-xl border border-white/20 text-gray-200 font-semibold text-sm hover:bg-white/5 transition-colors"
                >
                  {isEnglish ? "View 4 samples" : "查看 4 个样例"}
                </Link>
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

        <YiShunBottomActionBar
          statusText={isEnglish ? "Reports are saved on this device. Manage or continue when ready." : "报告保存在本设备；可继续查看或管理。"}
          primary={{
            label: isEnglish ? "Continue reading" : "继续查看",
            icon: "□",
            onClick: () => { window.location.href = "/reading/start"; },
          }}
          secondary={{
            label: isEnglish ? "Share" : "分享",
            icon: "↗",
            onClick: () => {
              const latest = dailyHistory[0];
              if (latest) void copyDailySummary(latest);
              else window.location.href = "/samples";
            },
            state: copiedDate && copiedDate !== "local-state" ? "success" : "default",
            successLabel: isEnglish ? "Copied" : "已复制",
            disabled: dailyHistory.length === 0,
            disabledReason: isEnglish ? "Generate a report before sharing." : "生成报告后可分享。",
          }}
          tertiary={{
            label: isEnglish ? "Manage" : "管理",
            icon: "☷",
            onClick: saveLocalState,
            state: copiedDate === "local-state" ? "success" : "default",
            successLabel: isEnglish ? "Saved" : "已保存",
          }}
        />
      </main>
    </>
  );
}
