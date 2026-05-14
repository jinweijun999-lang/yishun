"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Background from "./components/Background";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Navigation from "./components/Navigation";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import { useI18n } from "./components/LocaleProvider";
import { YISHUN_EVENTS, trackYiShunEvent } from "@/lib/p1-analytics";

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
  "focused outreach": "专注沟通",
  "calm decisions": "冷静决策",
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

const copy = {
  en: {
    eyebrow: "Trusted Eastern timing rules · BaZi + Five Elements · Gemini explanation",
    title: "Know today’s best timing in 5 seconds — then see why it fits you.",
    subtitle:
      "YiShun combines trusted Eastern timing rules, your BaZi/Five Elements profile, and Gemini-personalized explanations so you can save, share, or unlock a premium report with confidence.",
    primary: "Start my free daily signal",
    open: "Open today’s signal",
    sample: "View sample reports",
    profile: "Account",
    login: "Sign in",
    signedIn: "Signed in",
    trust: "Privacy boundary: public cards never show birth date, birth place, email, or private chart details. Not fortune-telling — a structured reflection tool for timing, priorities, and decisions.",
    heroCardLabel: "Today’s Decision Brief",
    clarity: "Timing clarity",
    bestFor: "Best for",
    bestHour: "Best window",
    element: "Element",
    direction: "Direction",
    do: "Move",
    avoid: "Avoid",
    saved: "Saved signal",
    sampleSignal: "Live sample",
    mechanism: "Product highlights",
    mechanisms: [
      ["01", "Action, not vague fortune text", "Every result gives one best window, one avoid boundary, and one next step you can actually use today."],
      ["02", "Explainable calculation layer", "The app shows which structured signals were used: birth profile, Four Pillars, Five Elements balance, true solar time, and daily timing score."],
      ["03", "Retention and monetization built in", "Save history, build a streak, share a public card, then upgrade only when a full 7-day report is useful."],
    ],
    accuracyLabel: "How accuracy is handled",
    accuracyTitle: "Not a black-box AI answer. Rules compute; AI explains.",
    accuracyPoints: [
      "Birth date/time and timezone are normalized before chart generation.",
      "True solar time correction is shown when location data is available.",
      "Four Pillars, Day Master, Five Elements, Ten Gods, score, and timing window come from the rules engine.",
      "Gemini may personalize wording, but cannot change the core facts.",
    ],
    journeyLabel: "Product flow",
    journeyTitle: "From birth data to a daily operating brief",
    journey: [
      "Enter birth profile once",
      "Rules engine reads BaZi + Five Elements",
      "Gemini explains the personalized why",
      "Save, share, or unlock a premium report",
    ],
    proofLabel: "Trust layer",
    proofTitle: "Built for overseas users who need clarity, not superstition",
    proof: ["Trusted Eastern timing rules", "BaZi + Five Elements", "Gemini explanation", "Save/share/premium report"],
    learn: "Learn the BaZi basics",
    powered: "Structured BaZi timing engine · for reflection only",
  },
  zh: {
    eyebrow: "东方时机智能 · 可解释的每日决策信号",
    title: "别再问“会发生什么”，开始判断“现在该不该行动”。",
    subtitle:
      "易顺把八字与五行时机转成清晰的每日决策系统：今天该推进什么、延后什么，以及这个信号的依据是什么。",
    primary: "开始免费今日信号",
    open: "打开今日信号",
    sample: "查看示例报告",
    profile: "账户",
    login: "登录",
    signedIn: "已登录",
    trust: "隐私边界：公开卡不展示出生日期、出生地、邮箱或私人命盘细节。易顺不是算命，而是用于时机、优先级和决策复盘的结构化工具。",
    heroCardLabel: "今日决策简报",
    clarity: "时机清晰度",
    bestFor: "适合",
    bestHour: "黄金窗口",
    element: "五行",
    direction: "方向",
    do: "宜行动",
    avoid: "避开",
    saved: "已保存信号",
    sampleSignal: "实时示例",
    mechanism: "产品亮点",
    mechanisms: [
      ["01", "有依据的信号", "每条建议都呈现时段、五行平衡和行动边界，而不是一句玄学结论。"],
      ["02", "每日仪式闭环", "生成、保存、明日回访；产品建立连续记录，而不是一次性娱乐。"],
      ["03", "决策优先文案", "先回答“今天该怎么做”，再展示命盘和解释。"],
    ],
    accuracyLabel: "准确性如何处理",
    accuracyTitle: "不是黑盒 AI 答案：规则负责计算，AI 只负责解释。",
    accuracyPoints: [
      "出生日期、时间和时区会先标准化。",
      "有地点信息时会展示真太阳时校正。",
      "四柱、日主、五行、十神、分数和时段由规则引擎生成。",
      "Gemini 只能个性化表达，不能改动核心命盘事实。",
    ],
    journeyLabel: "产品流程",
    journeyTitle: "从出生信息到每日行动简报",
    journey: ["一次填写出生档案", "获得今日时机信号", "保存卡片并记录连续天数", "明天回访新的行动窗口"],
    proofLabel: "信任层",
    proofTitle: "面向海外用户：要清晰，不要迷信感",
    proof: ["信号可解释", "移动端优先", "隐私边界", "清晰边界声明"],
    learn: "了解八字基础",
    powered: "结构化八字时机引擎 · 仅供自我反思",
  },
};

export default function Home() {
  const { locale } = useI18n();
  const isZh = locale === "zh-CN";
  const c = isZh ? copy.zh : copy.en;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cachedPreview, setCachedPreview] = useState<CachedPreview | null>(null);
  const [completedDate, setCompletedDate] = useState<string | null>(null);

  useEffect(() => {
    trackYiShunEvent(YISHUN_EVENTS.HOME_VIEW, { source: "home_redesign" });
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

  const activeSignal = cachedPreview ?? sampleSignal;
  const hasSavedRitual = Boolean(cachedPreview);
  const today = new Date().toISOString().slice(0, 10);
  const completedToday = completedDate === today;
  const displaySignal = {
    focus: localizeValue(activeSignal.focus, isZh),
    bestFor: localizeList(activeSignal.dailySignal.bestFor, isZh),
    luckyElement: localizeValue(activeSignal.dailySignal.luckyElement, isZh),
    luckyDirection: localizeValue(activeSignal.dailySignal.luckyDirection, isZh),
    do: localizeValue(activeSignal.dailySignal.do, isZh),
    avoid: localizeValue(activeSignal.dailySignal.avoid, isZh),
  };

  return (
    <>
      <Background />
      <main className="ys-shell relative z-10 min-h-screen overflow-hidden pb-28 text-[#f5efe1]">
        <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[#c2a067]/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-14rem] top-40 h-[32rem] w-[32rem] rounded-full bg-[#5e8a72]/20 blur-3xl" />

        <header className="sticky top-0 z-40 border-b border-[#e8d7aa]/10 bg-[#080b09]/70 px-4 py-3 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3" aria-label="YiShun home">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#c2a067]/30 bg-[#c2a067]/10 text-sm font-black tracking-[-0.08em] shadow-[0_0_40px_rgba(194,160,103,0.18)]">{isZh ? "易" : "YS"}</span>
              <div>
                <p className="font-heading text-lg font-bold tracking-wide text-white">YiShun</p>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#c2a067]/70">Decision Ritual</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {authChecked && (
                profile ? (
                  <Link href="/profile" className="hidden rounded-full border border-white/10 px-4 py-2 text-xs text-[#e8d7aa] hover:bg-white/5 sm:inline-flex">
                    {c.signedIn} · {profile.email}
                  </Link>
                ) : (
                  <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 text-xs text-[#e8d7aa] hover:bg-white/5">
                    {c.login}
                  </Link>
                )
              )}
            </div>
          </div>
        </header>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:pb-16 lg:pt-14">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c2a067]/20 bg-[#c2a067]/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#d8bd7a]">
              <span className="h-2 w-2 rounded-full bg-[#7aa48c] shadow-[0_0_18px_rgba(122,164,140,0.8)]" />
              {c.eyebrow}
            </div>
            <h1 className="mt-6 max-w-3xl font-heading text-5xl font-black leading-[0.96] tracking-[-0.06em] text-white md:text-7xl">
              {c.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d8d0bf] md:text-xl">
              {c.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={hasSavedRitual ? "/reading/result" : "/reading/start"}
                onClick={() => {
                  track(hasSavedRitual ? "open_today_ritual_click" : "start_daily_signal_click", { source: "home_redesign" });
                  trackYiShunEvent(YISHUN_EVENTS.START_CLICK, { source: "home_redesign", has_saved_ritual: hasSavedRitual });
                }}
                className="group inline-flex items-center justify-center rounded-2xl bg-[#e0bd72] px-6 py-4 text-sm font-black text-[#10130f] shadow-[0_22px_60px_rgba(194,160,103,0.28)] transition hover:-translate-y-0.5 hover:bg-[#f1d28e]"
              >
                {hasSavedRitual ? c.open : c.primary}
                <span className="ml-2 transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/samples"
                onClick={() => track("sample_result_click", { source: "home_redesign", sample_count: 4 })}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-4 text-sm font-bold text-[#f5efe1] backdrop-blur transition hover:border-[#c2a067]/40 hover:bg-white/[0.06]"
              >
                {c.sample}
              </Link>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#9d9688]">{c.trust}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.08, duration: 0.55 }} className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#c2a067]/20 via-transparent to-[#5e8a72]/20 blur-2xl" />
            <article className="ys-share-card relative overflow-hidden rounded-[2rem] p-5 backdrop-blur-2xl md:p-6">
              <div className="absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full border border-[#c2a067]/20" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#c2a067]">{c.heroCardLabel}</p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white">
                    {activeSignal.dailySignal.score}<span className="text-xl text-[#8f8878]">/100</span>
                  </h2>
                  <p className="text-sm text-[#a9a18f]">{c.clarity}</p>
                </div>
                <span className="rounded-full border border-[#7aa48c]/30 bg-[#7aa48c]/10 px-3 py-1 text-xs font-bold text-[#a8d8bd]">
                  {completedToday ? c.saved : hasSavedRitual ? c.saved : c.sampleSignal}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  [c.bestFor, displaySignal.bestFor.slice(0, 2).join(" · ")],
                  [c.bestHour, activeSignal.dailySignal.bestHour],
                  [c.element, displaySignal.luckyElement],
                  [c.direction, displaySignal.luckyDirection],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl border border-white/8 bg-white/[0.045] p-4">
                    <p className="text-xs text-[#8f8878]">{label}</p>
                    <p className="mt-1 text-sm font-bold leading-5 text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-3xl border border-[#7aa48c]/25 bg-[#7aa48c]/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a8d8bd]">{c.do}</p>
                  <p className="mt-2 text-sm leading-6 text-[#e8e1d2]">{displaySignal.do}</p>
                </div>
                <div className="rounded-3xl border border-[#c2a067]/25 bg-[#c2a067]/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e0bd72]">{c.avoid}</p>
                  <p className="mt-2 text-sm leading-6 text-[#e8e1d2]">{displaySignal.avoid}</p>
                </div>
              </div>
            </article>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="ys-kicker">{c.mechanism}</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">{isZh ? "用户为什么愿意留下来？" : "Why would users stay?"}</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {c.mechanisms.map(([num, title, body], index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="ys-panel-soft rounded-[1.75rem] p-5 backdrop-blur-xl"
              >
                <p className="text-xs font-black text-[#c2a067]">{num}</p>
                <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#aaa292]">{body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6">
          <div className="ys-panel grid gap-5 rounded-[2rem] border border-[#7aa48c]/20 p-5 md:grid-cols-[0.85fr_1.15fr] md:p-6">
            <div>
              <p className="ys-kicker">{c.accuracyLabel}</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{c.accuracyTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-[#aaa292]">
                {isZh ? "我们把“准确性”拆成可检查的输入、算法和表达边界，而不是让用户相信一句玄学结论。" : "Accuracy is treated as a checkable pipeline: input normalization, deterministic calculation, visible evidence, then bounded explanation."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {c.accuracyPoints.map((item, index) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black text-[#7aa48c]">0{index + 1}</p>
                  <p className="mt-2 text-sm leading-6 text-[#ede6d6]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6">
          <div className="ys-panel grid gap-5 rounded-[2rem] p-5 md:grid-cols-[0.9fr_1.1fr] md:p-6">
            <div>
              <p className="ys-kicker">{isZh ? "每日节奏" : "Daily rhythm"}</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{isZh ? "不是一次性测算，而是每天 3 分钟的决策复盘。" : "Not a one-off reading. A 3-minute decision ritual you can repeat."}</h2>
              <p className="mt-3 text-sm leading-6 text-[#aaa292]">{isZh ? "易顺把今日信号压缩成可保存、可分享、可明天对比的节奏卡：今日窗口、行动边界和信任提示都在同一张卡里。" : "YiShun compresses the signal into a saveable, shareable rhythm card: window, action boundary, and trust notes in one place."}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [isZh ? "早上" : "Morning", isZh ? "看今日黄金窗口" : "Check the best window"],
                [isZh ? "行动前" : "Before acting", isZh ? "确认适合 / 避免" : "Review fit / avoid"],
                [isZh ? "晚上" : "Evening", isZh ? "保存并形成连续记录" : "Save and build streak"],
              ].map(([label, body]) => (
                <div key={label} className="ys-panel-soft rounded-3xl p-4">
                  <p className="text-xs font-black text-[#e0bd72]">{label}</p>
                  <p className="mt-3 text-sm leading-6 text-[#ede6d6]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2rem] border border-[#c2a067]/15 bg-[#c2a067]/[0.07] p-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#c2a067]">{c.journeyLabel}</p>
            <h2 className="mt-3 max-w-md text-3xl font-black tracking-[-0.05em] text-white">{c.journeyTitle}</h2>
            <div className="mt-6 space-y-3">
              {c.journey.map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e0bd72] text-xs font-black text-[#10130f]">{index + 1}</span>
                  <span className="text-sm font-semibold text-[#ede6d6]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0b0f0d]/70 p-6 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#7aa48c]">{c.proofLabel}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{c.proofTitle}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {c.proof.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-bold text-[#ede6d6]">
                  <span className="mr-2 text-[#7aa48c]">✓</span>{item}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/learn/bazi-basics" className="rounded-2xl border border-[#7aa48c]/30 px-5 py-3 text-sm font-bold text-[#a8d8bd] hover:bg-[#7aa48c]/10">
                {c.learn}
              </Link>
              <Link href="/reports" className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-[#d8d0bf] hover:bg-white/5">
                Reports →
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-3">
          <PwaInstallPrompt />
          <p className="mt-6 text-center text-xs text-[#766f62]">{c.powered}</p>
        </div>

        <Navigation />
      </main>
    </>
  );
}
