"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Background from "./components/Background";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Navigation from "./components/Navigation";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import PaymentValueMatrix from "./components/PaymentValueMatrix";
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

function hasSessionCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((item) => item.startsWith("fortune_session="));
}

function track(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.info("[YiShun funnel]", event, properties);
  window.dispatchEvent(new CustomEvent("yishun:analytics", { detail: { event, properties } }));
}

const copy = {
  en: {
    eyebrow: "Love · Career · Money answers · Daily Ritual · Destiny Card · Love compatibility · Ask AI master",
    title: "Unlock your full Eastern destiny report — then ask AI Master, test TA, or draw today’s sign.",
    subtitle:
      "The main card is your complete destiny report preview: personality, love, career, wealth, helpful people, and the next 90 days. Ask your most important life question through AI Master for a Career decision, Money window, Love compatibility, or complete a 30-second ritual; Daily Timing stays a small supporting window.",
    primary: "Ask AI Master",
    open: "Open my destiny preview",
    sample: "View locked report preview",
    profile: "Account",
    login: "Sign in",
    signedIn: "Signed in",
    trust: "Privacy boundary: public cards never show birth date, birth place, email, or private chart details. Not fortune-telling — a structured reflection tool for timing, priorities, and decisions.",
    heroCardLabel: "Four榜单入口 · Free first · Paid depth",
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
      ["01", "AI Master answers", "Use 1 Ask Credit for one focused question after balance check and explicit confirmation."],
      ["02", "Relationship compatibility", "Start from two-person fit and emotional timing; partner details are not persisted in the lite flow."],
      ["03", "Full destiny report", "Free shows a useful summary first. Paid Full Report unlocks deeper modules and does not consume Ask Credits."],
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
    eyebrow: "今日抽签 · 命格卡 · 测我和TA · 问一件事",
    title: "先看完整东方命运报告，再问大师、测关系或抽今日一签。",
    subtitle:
      "首屏主卡是完整命运报告预览：性格、爱情、事业、财富、贵人、未来90天。用户可继续问 AI 大师、测我和 TA、或 30 秒抽签；Daily Timing 只做小型时间窗口。",
    primary: "问 AI 大师",
    open: "打开命运预览",
    sample: "查看锁定报告预览",
    profile: "账户",
    login: "登录",
    signedIn: "已登录",
    trust: "隐私边界：公开卡不展示出生日期、出生地、邮箱或私人命盘细节。易顺不是算命，而是用于时机、优先级和决策复盘的结构化工具。",
    heroCardLabel: "四个榜单入口 · 免费先体验 · 付费看深度",
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
      ["01", "AI大师问事", "余额预检并明确确认后，消耗 1 次问事，回答一个聚焦问题。"],
      ["02", "关系合盘", "从两个人适不适合、相处节奏和情感时机切入；轻量版不持久化伴侣隐私。"],
      ["03", "完整命运报告", "免费先看摘要；付费解锁深度模块，且不消耗问事次数。"],
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

  useEffect(() => {
    track("view_home", { source: "home_rank_grid" });
    trackYiShunEvent(YISHUN_EVENTS.HOME_VIEW, { source: "home_redesign" });
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
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["🪄", isZh ? "问 AI 大师" : "Ask AI Master", isZh ? "爱情/事业/财富/关系，一问一答。" : "Love, career, money, relationship, or other.", "/ask-master?source=home_rank", "bg-[#e0bd72] text-[#10130f] shadow-[0_22px_60px_rgba(194,160,103,0.28)]"],
                ["💞", isZh ? "测我和 TA" : "Check me and TA", isZh ? "缘分分、冲突点、是否推进。" : "Match score, conflict, advance or pause.", "/compatibility?source=home_rank", "border border-[#f4a6b8]/30 bg-[#f4a6b8]/10 text-[#f5efe1]"],
                ["🃏", isZh ? "今日抽一签" : "Draw today’s sign", isZh ? "选主题、抽签、解签、今日行动。" : "Choose theme, draw, interpret, act today.", "/daily-ritual?source=home_rank", "border border-[#7aa48c]/35 bg-[#7aa48c]/10 text-[#f5efe1]"],
              ].map(([icon, label, body, href, tone]) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => track("consumer_rank_entry_click", { source: "home_rank_grid", label })}
                  className={`group rounded-3xl px-5 py-4 transition hover:-translate-y-0.5 ${tone}`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="mt-3 block text-sm font-black">{label}</span>
                  <span className="mt-2 block text-xs leading-5 opacity-80">{body}</span>
                  <span className="mt-3 inline-flex text-xs font-black transition group-hover:translate-x-1">Start free →</span>
                </Link>
              ))}
            </div>
            <p className="mt-4 max-w-xl text-xs leading-5 text-[#9d9688]">{isZh ? "P0 路径：完整报告是主卡；三 CTA 进入问大师、测关系、抽签。Daily Timing 只作为 bestTime 小信号。" : "P0 path: report preview is the main card; three CTAs start AI Master, compatibility, and ritual. Daily Timing appears only as best-time micro signal."}</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#9d9688]">{c.trust}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.08, duration: 0.55 }} className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#c2a067]/20 via-transparent to-[#5e8a72]/20 blur-2xl" />
            <article className="ys-share-card relative overflow-hidden rounded-[2rem] p-5 backdrop-blur-2xl md:p-6">
              <div className="absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full border border-[#c2a067]/20" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#c2a067]">{c.heroCardLabel}</p>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                    {isZh ? "你的完整命运报告，先看摘要再解锁。" : "Your full destiny report, previewed before unlock."}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[#a9a18f]">
                    {isZh
                      ? "首页必须让用户立刻知道：这是问事、关系、抽签和完整报告 App，不是单一 Daily Timing 工具。"
                      : "The first screen makes the product obvious: AI answers, relationship matching, ritual draw, and a full report—not a Daily Timing utility."}
                  </p>
                </div>
                <span className="rounded-full border border-[#e0bd72]/30 bg-[#e0bd72]/10 px-3 py-1 text-xs font-bold text-[#e0bd72]">
                  {isZh ? "锁定预览" : "Locked preview"}
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  [isZh ? "完整命运报告" : "Full destiny report", isZh ? "性格/爱情/事业/财富/贵人/未来90天" : "Personality, love, career, wealth, helpers, next 90 days", "📜"],
                  [isZh ? "问 AI 大师" : "Ask AI master", isZh ? "结论 / 3依据 / 风险 / 7-30天行动" : "Conclusion, 3 reasons, risk, 7/30-day actions", "🪄"],
                  [isZh ? "测我和 TA" : "Love compatibility", isZh ? "缘分分、吸引点、冲突点、窗口" : "Score, attraction, conflict, best window", "💞"],
                  [isZh ? "今日抽签" : "Daily ritual", isZh ? "选主题→抽签→解签→今日行动" : "Choose theme → draw → interpret → act today", "🃏"],
                ].map(([title, body, icon]) => (
                  <div key={title} className="group rounded-3xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#e0bd72]/30 hover:bg-[#e0bd72]/10">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/30 text-xl">{icon}</span>
                      <div>
                        <p className="text-sm font-black text-white">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#aaa292]">{body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-3xl border border-[#7aa48c]/25 bg-[#7aa48c]/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a8d8bd]">{isZh ? "隐私默认安全" : "Privacy-safe by default"}</p>
                <p className="mt-2 text-sm leading-6 text-[#e8e1d2]">
                  {isZh ? "分享卡只展示昵称化命格与行动建议，不展示生日、出生地、邮箱或完整命盘。" : "Share cards show a nickname-style archetype and action prompt, never birth date, location, email, or private chart details."}
                </p>
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

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-3 space-y-5">
          <section className="ys-panel rounded-[2rem] p-5 sm:p-6">
            <p className="ys-kicker">{isZh ? "3 分钟强体验" : "3-minute strong experiences"}</p>
            <h2 className="mt-2 text-2xl font-heading font-bold text-white">{isZh ? "先完成一次情感、问事、占卜或付费报告体验" : "Start with love, Ask AI, divination, or a deep report."}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[
                ["🃏", isZh ? "今日抽签" : "Tarot / Oracle / Coin", "/daily-ritual?source=home_p0"],
                ["🪪", isZh ? "命格卡" : "$0.99-style deep report", "/profile-card?source=home_p0"],
                ["💘", isZh ? "测我和 TA" : "Love Compatibility", "/compatibility?source=home_p0"],
                ["💬", isZh ? "Ask AI 问事" : "Ask AI Love/Money/Career", "/ask-master?source=home_p0"],
              ].map(([icon, title, href]) => (
                <Link key={title} href={href} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-sm font-bold text-white transition hover:border-secondary/40 hover:bg-secondary/10">
                  <span className="mb-3 block text-2xl">{icon}</span>{title}
                </Link>
              ))}
            </div>
          </section>

          <PaymentValueMatrix isEnglish={!isZh} credits={profile?.consultationCredits} source="home" />
          <PwaInstallPrompt />
          <p className="mt-6 text-center text-xs text-[#766f62]">{c.powered}</p>
        </div>

        <Navigation />
      </main>
    </>
  );
}
