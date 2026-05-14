"use client";

import { useRouter } from "next/navigation";
import Background from "../../components/Background";
import Navigation from "../../components/Navigation";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import AppBackLink from "../../components/AppBackLink";
import { useI18n } from "../../components/LocaleProvider";

const sampleData = {
  name: { en: "Sample user", zh: "示例用户" },
  birthDate: "1990-05-20",
  birthTime: "08:30",
  gender: { en: "Not specified", zh: "未指定" },
  pillars: {
    year: { en: "Ji-Si", zh: "己巳" },
    month: { en: "Yi-Chou", zh: "乙丑" },
    day: { en: "Wu-Zi", zh: "戊子" },
    hour: { en: "Ren-Zi", zh: "壬子" },
  },
  elements: [
    { label: "Wood", value: 20, color: "bg-green-500" },
    { label: "Fire", value: 20, color: "bg-red-500" },
    { label: "Earth", value: 40, color: "bg-yellow-600" },
    { label: "Metal", value: 0, color: "bg-gray-400" },
    { label: "Water", value: 20, color: "bg-blue-500" },
  ],
  tenGods: {
    year: "Authority",
    month: "Peer",
    day: "Day Master",
    hour: "Wealth",
  },
};

const pillarKeys = ["year", "month", "day", "hour"] as const;
const pillarLabels = {
  en: ["Year", "Month", "Day", "Hour"],
  zh: ["年柱", "月柱", "日柱", "时柱"],
} as const;
const elementLabels = {
  Wood: { en: "Wood", zh: "木" },
  Fire: { en: "Fire", zh: "火" },
  Earth: { en: "Earth", zh: "土" },
  Metal: { en: "Metal", zh: "金" },
  Water: { en: "Water", zh: "水" },
} as const;
const tenGodLabels = {
  Authority: { en: "Authority", zh: "官杀" },
  Peer: { en: "Peer", zh: "比劫" },
  "Day Master": { en: "Day Master", zh: "日主" },
  Wealth: { en: "Wealth", zh: "财星" },
} as const;

export default function SamplePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const isEnglish = locale === "en";
  const copy = {
    back: t("common.goBack"),
    chart: t("sample.chart"),
    title: t("sample.title"),
    demo: t("sample.demo"),
    profile: t("sample.profile"),
    name: t("sample.name"),
    gender: t("sample.gender"),
    birthDate: t("sample.birthDate"),
    birthTime: t("sample.birthTime"),
    pillars: t("sample.pillars"),
    elements: t("sample.elements"),
    tenGods: t("sample.tenGods"),
    ctaTitle: t("sample.ctaTitle"),
    ctaBody: t("sample.ctaBody"),
    cta: t("sample.cta"),
  };

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-24">
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AppBackLink label={copy.back} context={copy.title} />
              <h1 className="hidden text-lg font-heading font-bold text-white sm:block">{copy.title}</h1>
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4">
            <p className="text-xs text-accent text-center">
              {copy.demo}
            </p>
          </div>

          <section className="rounded-2xl bg-surface/60 border border-white/10 p-5" aria-labelledby="sample-profile-heading">
            <h2 id="sample-profile-heading" className="text-lg font-heading font-bold text-white mb-4">
              {copy.profile}
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">{copy.name}</p>
                <p className="text-white">{isEnglish ? sampleData.name.en : sampleData.name.zh}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{copy.gender}</p>
                <p className="text-white">{isEnglish ? sampleData.gender.en : sampleData.gender.zh}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{copy.birthDate}</p>
                <p className="text-white">{sampleData.birthDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{copy.birthTime}</p>
                <p className="text-white">{sampleData.birthTime}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-surface/60 border border-white/10 p-5" aria-labelledby="sample-pillars-heading">
            <h2 id="sample-pillars-heading" className="text-lg font-heading font-bold text-white mb-4">
              {copy.pillars}
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {pillarKeys.map((key, index) => {
                const label = pillarLabels[isEnglish ? "en" : "zh"][index];
                const value = sampleData.pillars[key][isEnglish ? "en" : "zh"];
                const color = ["bg-accent/10", "bg-secondary/10", "bg-primary/10", "bg-green-500/10"][index];
                const textColor = ["text-accent", "text-secondary", "text-primary", "text-green-500"][index];
                return (
                  <div key={key} className={`text-center p-3 rounded-xl ${color}`}>
                    <p className={`text-xs mb-1 ${textColor}`}>{label}</p>
                    <p className="text-lg font-bold text-white">{value}</p>
                    {key === "day" && <p className="text-xs text-gray-500 mt-1">{isEnglish ? "Day Master" : "日主"}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-surface/60 border border-white/10 p-5" aria-labelledby="sample-elements-heading">
            <h2 id="sample-elements-heading" className="text-lg font-heading font-bold text-white mb-4">
              {copy.elements}
            </h2>
            <div className="space-y-3">
              {sampleData.elements.map((element) => (
                <div key={element.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{elementLabels[element.label as keyof typeof elementLabels][isEnglish ? "en" : "zh"]}</span>
                    <span className="text-gray-400">{element.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div className={`h-2 rounded-full ${element.color}`} style={{ width: `${element.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-surface/60 border border-white/10 p-5" aria-labelledby="sample-ten-gods-heading">
            <h2 id="sample-ten-gods-heading" className="text-lg font-heading font-bold text-white mb-4">
              {copy.tenGods}
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {pillarKeys.map((key, index) => {
                const label = pillarLabels[isEnglish ? "en" : "zh"][index];
                const value = [sampleData.tenGods.year, sampleData.tenGods.month, sampleData.tenGods.day, sampleData.tenGods.hour][index];
                const color = ["bg-accent/10", "bg-secondary/10", "bg-primary/10", "bg-green-500/10"][index];
                const textColor = ["text-accent", "text-secondary", "text-primary", "text-green-500"][index];
                return (
                  <div key={key} className={`text-center p-3 rounded-xl ${color}`}>
                    <p className={`text-xs mb-1 ${textColor}`}>{label}</p>
                    <p className="text-sm font-bold text-white">{tenGodLabels[value as keyof typeof tenGodLabels][isEnglish ? "en" : "zh"]}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-br from-secondary/10 to-accent/5 border border-secondary/20 p-5">
            <h3 className="text-lg font-heading font-bold text-white mb-2">{copy.ctaTitle}</h3>
            <p className="text-xs text-gray-400 mb-4">
              {copy.ctaBody}
            </p>
            <a
              href="/reading/start"
              className="block w-full px-4 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm text-center hover:bg-secondary transition-colors"
            >
              {copy.cta}
            </a>
          </section>

          <section className="rounded-2xl bg-surface/60 border border-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-accent/80">{isEnglish ? "Consumer-grade upgrade" : "消费级升级"}</p>
            <h2 className="mt-2 text-lg font-heading font-bold text-white">
              {isEnglish ? "Show value, trust, and return paths before asking users to pay." : "先展示价值、可信度和回访路径，再请求付费。"}
            </h2>
            <div className="mt-4 grid gap-3 text-xs leading-5 text-gray-300">
              {(isEnglish
                ? [
                    "Premium: deep report, PDF/share image, action checklist, and a 30-day plan.",
                    "Trust: why this result, why this time, rules engine vs Gemini, and a clear disclaimer.",
                    "Retention: tomorrow reminder, important-date reminder, and streak incentive.",
                  ]
                : [
                    "付费：深度报告、PDF/长图、行动清单和 30 天计划。",
                    "可信：解释为什么是这个结果/时段，区分规则引擎与 Gemini，并展示免责声明。",
                    "留存：明日提醒、重要日期提醒和连续天数激励。",
                  ]
              ).map((item) => <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3">{item}</div>)}
            </div>
          </section>
        </div>

        <Navigation />
      </main>
    </>
  );
}
