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
    eyebrow: "Full destiny report · AI question · Love match · Ritual draw · Share card · Daily timing support",
    title: "Unlock your full destiny report, then ask the AI master what to do next.",
    subtitle:
      "Enter your birth profile once. YiShun turns it into a complete destiny preview with love, career, money, helpful people, and next-90-day signals — then lets you ask a focused question, check a relationship, draw a ritual sign, or save a privacy-safe share card.",
    primary: "Ask AI master",
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
    outcomeLabel: "What users get in 3 minutes",
    outcomeTitle: "A concrete decision artifact users can save, revisit, and share.",
    outcomes: [
      ["Decision card", "One clear answer: act now, wait, repair, ask, or protect your boundary."],
      ["Reason layer", "3 traceable reasons from birth rhythm, today window, and user intent."],
      ["Action plan", "A safe next step for today plus a 7/30-day follow-up prompt."],
      ["Private share", "A polished SVG card users can save/share without birth date or birthplace."],
    ],
    mechanisms: [
      ["01", "AI Master answers", "A focused question returns conclusion, 3 reasons, risk, and a near-term action plan."],
      ["02", "Relationship compatibility", "Two-person fit, attraction, conflict point, and whether to advance or pause."],
      ["03", "Full destiny report", "Personality, love, career, wealth, helpful people, and next-90-day modules in one path."],
    ],
    accuracyLabel: "How accuracy is handled",
    accuracyTitle: "Not a black-box answer. YiShun shows the reasoning in plain language.",
    accuracyPoints: [
      "Birth date/time and timezone are normalized before chart generation.",
      "True solar time correction is shown when location data is available.",
      "Your score and timing window are calculated from structured birth and timing inputs.",
      "YiShun may personalize wording, but cannot change the core facts.",
    ],
    journeyLabel: "Product flow",
    journeyTitle: "From birth data to a daily operating brief",
    journey: [
      "Enter birth profile once",
      "Get today's judgment, best window, avoid note, and one step",
      "Save or share a privacy-safe timing card",
      "Continue into report, AI question, love match, or ritual draw",
    ],
    proofLabel: "Trust layer",
    proofTitle: "Built for overseas users who need clarity, not superstition",
    proof: ["Clear today judgment", "Best action window", "Privacy-safe share card", "Save and revisit"],
    learn: "Learn the BaZi basics",
    powered: "Full destiny report · AI master · love match · ritual draw · for reflection and planning only",
  },
  zh: {
    eyebrow: "完整命运报告 · AI问事 · 关系合盘 · 抽签 · 分享卡 · 每日时机辅助",
    title: "先看完整命运报告，再问 AI 大师下一步怎么走。",
    subtitle:
      "填写一次出生资料，易顺先给你完整命运预览：性格、爱情、事业、财富、贵人和未来90天，再继续问事、测关系、抽签，或保存一张隐私安全的分享卡。",
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
    outcomeLabel: "3 分钟用户拿到什么",
    outcomeTitle: "给用户一个可保存、可复访、可分享的决策产物。",
    outcomes: [
      ["决策卡", "明确告诉用户：推进、等待、修复关系、提问，还是先守住边界。"],
      ["依据层", "把出生节律、今日窗口、用户意图拆成 3 条可理解理由。"],
      ["行动方案", "给今日一步行动，以及 7/30 天后可复盘的提示。"],
      ["隐私分享", "生成可保存/可分享的 SVG 卡片，不暴露生日或出生地。"],
    ],
    mechanisms: [
      ["01", "AI大师问事", "一个聚焦问题返回结论、3条依据、风险提醒和近期行动方案。"],
      ["02", "关系合盘", "输出两人缘分分、吸引点、冲突点，以及该推进还是暂停。"],
      ["03", "完整命运报告", "把性格、爱情、事业、财富、贵人、未来90天串成一条完整路径。"],
    ],
    accuracyLabel: "准确性如何处理",
    accuracyTitle: "不是黑盒答案：易顺把原因讲清楚，不制造焦虑。",
    accuracyPoints: [
      "出生日期、时间和时区会先标准化。",
      "有地点信息时会展示真太阳时校正。",
      "分数和行动窗口来自结构化出生信息与今日时机输入。",
      "易顺只把结果讲得更好懂，不改动核心命盘事实。"
    ],
    journeyLabel: "产品流程",
    journeyTitle: "从出生信息到每日行动简报",
    journey: ["一次填写出生档案", "拿到今日判断、最佳窗口、避开事项和一步建议", "保存或分享隐私安全的时机卡", "继续探索完整报告、AI问事、合盘或抽签"],
    proofLabel: "信任层",
    proofTitle: "面向海外用户：要清晰，不要迷信感",
    proof: ["今日判断清晰", "最佳行动窗口", "隐私安全分享", "保存并复访"],
    learn: "了解八字基础",
    powered: "完整命运报告 · AI大师 · 关系合盘 · 抽签 · 仅供自我反思和计划参考",
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
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="relative z-20">
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
                <a
                  key={label}
                  href={href}
                  onClick={() => track("consumer_rank_entry_click", { source: "home_rank_grid", label })}
                  className={`group block rounded-3xl px-5 py-4 transition hover:-translate-y-0.5 ${tone}`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="mt-3 block text-sm font-black">{label}</span>
                  <span className="mt-2 block text-xs leading-5 opacity-80">{body}</span>
                  <span className="mt-3 inline-flex text-xs font-black transition group-hover:translate-x-1">Start free →</span>
                </a>
              ))}
            </div>
            <p className="mt-4 max-w-xl text-xs leading-5 text-[#9d9688]">{isZh ? "主入口：完整报告、AI问事、关系合盘。次入口：抽签、分享卡、每日时机。" : "Primary paths: full report, AI question, and love match. Secondary paths: ritual draw, share card, and daily timing."}</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#9d9688]">{c.trust}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/reading/start"
                onClick={() => track("home_primary_reading_cta_click", { source: "home_primary_cta" })}
                className="inline-flex rounded-2xl bg-[#e0bd72] px-5 py-3 text-sm font-black text-[#10130f] shadow-[0_18px_45px_rgba(224,189,114,0.22)] transition hover:-translate-y-0.5"
              >
                {isZh ? "开始免费命运预览" : "Start my free destiny preview"}
              </a>
              <Link href="/reports?source=home_primary_cta" className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-[#d8d0bf] hover:bg-white/5">
                {isZh ? "查看报告样例" : "View report sample"}
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.08, duration: 0.55 }} className="relative">
            <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#c2a067]/20 via-transparent to-[#5e8a72]/20 blur-2xl" />
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
                      ? "首页要让用户立刻知道：输入出生资料后，主线是完整命运报告，并继续进入问事、合盘、抽签和分享。"
                      : "The first screen shows the product promise: birth profile in, full destiny report preview out, then continue into AI question, love match, ritual draw, and sharing."}
                  </p>
                  <div className="mt-4 grid gap-2 rounded-3xl border border-[#e0bd72]/20 bg-black/25 p-3 text-xs text-[#efe6d2] sm:grid-cols-2">
                    {[
                      [isZh ? "完整报告" : "Full report", isZh ? "性格 / 爱情 / 事业 / 财富 / 贵人" : "Personality / love / career / wealth / helpers"],
                      [isZh ? "AI问事" : "AI question", isZh ? "结论、3条依据、风险和行动方案" : "Conclusion, 3 reasons, risk, action plan"],
                      [isZh ? "关系合盘" : "Love match", isZh ? "缘分分、吸引点、冲突点" : "Score, attraction, conflict"],
                      [isZh ? "抽签分享" : "Ritual share", isZh ? "每日仪式、保存分享、引导复访" : "Daily ritual, save/share, return loop"],
                    ].map(([label, body]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="font-black text-white">{label}</p>
                        <p className="mt-1 leading-5 text-[#aaa292]">{body}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="rounded-full border border-[#e0bd72]/30 bg-[#e0bd72]/10 px-3 py-1 text-xs font-bold text-[#e0bd72]">
                  {isZh ? "锁定预览" : "Locked preview"}
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  [isZh ? "完整报告" : "Full report", isZh ? "主入口：性格/爱情/事业/财富/贵人/未来90天" : "Primary: personality, love, career, wealth, helpers, next 90 days", "📜"],
                  [isZh ? "AI 问事" : "AI question", isZh ? "主入口：结论 / 3依据 / 风险 / 7-30天行动" : "Primary: conclusion, 3 reasons, risk, 7/30-day actions", "🪄"],
                  [isZh ? "关系合盘" : "Love match", isZh ? "主入口：缘分分、吸引点、冲突点、推进/暂停" : "Primary: score, attraction, conflict, advance or pause", "💞"],
                  [isZh ? "抽签/分享/每日时机" : "Ritual/share/daily timing", isZh ? "次入口：抽签、保存分享卡、每天复访" : "Secondary: draw, save/share card, return daily", "🃏"],
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
          <div className="ys-panel overflow-hidden rounded-[2rem] border border-[#e0bd72]/20 p-5 md:p-6">
            <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
              <div>
                <p className="ys-kicker">{c.outcomeLabel}</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">{c.outcomeTitle}</h2>
                <p className="mt-3 text-sm leading-6 text-[#aaa292]">
                  {isZh
                    ? "用户进入后必须立刻知道自己会得到什么、为什么可信、下一步怎么用。"
                    : "Users immediately understand the output, why it is trustworthy, and how to use it next."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.outcomes.map(([title, body], index) => (
                  <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#e0bd72] text-xs font-black text-[#10130f]">{index + 1}</span>
                      <div>
                        <p className="text-sm font-black text-white">{title}</p>
                        <p className="mt-2 text-xs leading-5 text-[#aaa292]">{body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
                {isZh ? "我们把“准确性”拆成可检查的输入、计算和表达边界，而不是让用户相信一句玄学结论。" : "Accuracy is treated as a checkable flow: input normalization, calculation, visible evidence, then bounded explanation."}
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
