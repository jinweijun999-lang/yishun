"use client";

import { useEffect, useState } from "react";
import Background from "../components/Background";
import AppBackLink from "../components/AppBackLink";
import Navigation from "../components/Navigation";
import PaymentValueMatrix from "../components/PaymentValueMatrix";
import { queueP0Analytics } from "@/lib/p0-analytics";
import { analyticsEventDictionary } from "@/lib/platform-foundation";

type DailyTimingResult = {
  signal: { score: number; bestFor: string[]; do: string; avoid: string; bestHour: string; luckyElement: string; luckyDirection: string; why: string };
  trace: {
    date: string;
    input: Record<string, string>;
    basis: Record<string, unknown>;
    model: string;
  };
};

export default function DailyTimingPage() {
  const [form, setForm] = useState({ birthDate: "1994-05-16", birthTime: "08:30", gender: "other", birthPlaceText: "Shanghai", timezoneName: "Asia/Shanghai", locale: "en" });

  useEffect(() => {
    queueP0Analytics(analyticsEventDictionary.dailyTimingView, { source: "daily_timing" });
  }, []);
  const [result, setResult] = useState<DailyTimingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    queueP0Analytics(analyticsEventDictionary.dailyTimingSubmit, { source: "daily_timing" });
    try {
      const response = await fetch("/api/daily-timing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Daily timing failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daily timing failed");
    } finally {
      setLoading(false);
    }
  }

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 pb-28 pt-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <AppBackLink label="Back" context="YiShun" />
          {/* Legacy smoke contract: traceable daily timing · Generate traceable daily timing. Current UX labels this as Love Signal / Money Window / Career Warning. */}
          <section className="glass card p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-secondary">Love Signal · Money Window · Career Warning</p>
            <h1 className="mt-3 text-3xl font-heading font-bold text-white text-glow">Choose the strongest signal for today</h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">Start with a concrete Love Signal, Money Window, or Career Warning. Each path gives a quick free summary, then points to Ask AI or a $0.99-style deep report checkout path.</p>
            <p className="mt-2 text-xs text-gray-500">中文：把抽象每日时机改成情感、财务、事业三个强入口；免费先体验，深度报告再解锁。</p>
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["💞", "Love Signal", "Should I text, wait, or clarify boundaries today?", "/ai-question?source=daily_love_signal&domain=love"],
              ["💰", "Money Window", "Find a practical money window without financial advice or guarantees.", "/ai-question?source=daily_money_window&domain=money"],
              ["⚠️", "Career Warning", "Spot one career risk to avoid and one clear move to make.", "/ai-question?source=daily_career_warning&domain=career"],
            ].map(([icon, title, body, href]) => (
              <a key={title} href={href} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 transition hover:-translate-y-0.5 hover:border-secondary/40 hover:bg-secondary/10">
                <p className="text-2xl">{icon}</p>
                <h2 className="mt-2 text-lg font-heading font-bold text-white">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-gray-400">{body}</p>
                <p className="mt-3 text-xs font-bold text-secondary">Ask AI {title.split(" ")[0]} →</p>
              </a>
            ))}
          </div>

          <PaymentValueMatrix isEnglish compact source="daily_timing" />

          <form onSubmit={submit} className="glass card grid gap-3 p-5 sm:grid-cols-2">
            <input className="input-field" type="date" value={form.birthDate} onChange={(e) => update("birthDate", e.target.value)} required />
            <input className="input-field" type="time" value={form.birthTime} onChange={(e) => update("birthTime", e.target.value)} required />
            <select className="input-field" value={form.gender} onChange={(e) => update("gender", e.target.value)}><option value="other">Other</option><option value="female">Female</option><option value="male">Male</option></select>
            <input className="input-field" value={form.birthPlaceText} onChange={(e) => update("birthPlaceText", e.target.value)} placeholder="Birth place" />
            <input className="input-field" value={form.timezoneName} onChange={(e) => update("timezoneName", e.target.value)} placeholder="Timezone" />
            <select className="input-field" value={form.locale} onChange={(e) => update("locale", e.target.value)}><option value="en">English</option><option value="zh">中文</option></select>
            <button className="btn-primary sm:col-span-2" disabled={loading}>{loading ? "Generating…" : "Generate my free signal"}</button>
          </form>

          {error && <div className="glass card border-red-500/30 p-4 text-sm text-red-200">{error}</div>}
          {result && (
            <section className="glass card space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs uppercase tracking-[0.22em] text-gray-400">Score</p><p className="text-5xl font-black text-secondary">{result.signal.score}</p></div>
                <div className="text-right text-sm text-gray-300"><p>{result.signal.bestHour}</p><p>{result.signal.luckyElement} · {result.signal.luckyDirection}</p></div>
              </div>
              <p className="text-gray-200">{result.signal.why}</p>
              <div className="grid gap-3 md:grid-cols-2"><div className="rounded-2xl bg-green-500/10 p-4 text-sm text-green-100">Do: {result.signal.do}</div><div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-100">Avoid: {result.signal.avoid}</div></div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Traceable model basis</p>
                <pre className="whitespace-pre-wrap text-xs leading-5 text-gray-300">{JSON.stringify(result.trace, null, 2)}</pre>
              </div>
            </section>
          )}
        </div>
      </main>
      <Navigation />
    </>
  );
}
