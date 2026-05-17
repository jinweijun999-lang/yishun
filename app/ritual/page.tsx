"use client";

import { useEffect, useState } from "react";
import Background from "../components/Background";
import AppBackLink from "../components/AppBackLink";
import Navigation from "../components/Navigation";
import { queueP0Analytics } from "@/lib/p0-analytics";
import { analyticsEventDictionary } from "@/lib/platform-foundation";

type RitualResponse = {
  ok: boolean;
  type: string;
  safety: { persistence: string; paidExecution: boolean; aiUsed: boolean; disclaimer: string };
  ritual: { id: string; title: string; summary: string; action: string; basis: string; method: string; ctas: { save: string; share: string } };
  quality: { passed: boolean; score: number; maxScore: number };
};

export default function RitualPage() {
  const [type, setType] = useState("oracle");
  const [result, setResult] = useState<RitualResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openRitual(nextType = type) {
    setLoading(true);
    setError("");
    queueP0Analytics(analyticsEventDictionary.ritualOpen, { type: nextType });
    try {
      const response = await fetch(`/api/ritual?type=${encodeURIComponent(nextType)}&seed=${Date.now()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ritual failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ritual failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void openRitual("oracle");
    }, 0);
    return () => window.clearTimeout(initialLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 pb-28 pt-8">
        <div className="mx-auto max-w-2xl space-y-5">
          <AppBackLink label="Back" context="YiShun" />
          <section className="glass card p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-secondary">Eastern Ritual · safe minimum</p>
            <h1 className="mt-3 text-3xl font-heading font-bold text-white text-glow">Draw a daily reflection tool</h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">Start with a lightweight oracle / coin / draw ritual. It is free, non-persistent, and designed to feed the onboarding → report → save/share loop without making Gemini the main character.</p>
          </section>

          <section className="glass card grid gap-3 p-5 sm:grid-cols-3">
            {[
              ["oracle", "Oracle line"],
              ["coins", "Copper coins"],
              ["draw", "Daily draw"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`rounded-2xl border px-4 py-3 text-sm font-bold ${type === value ? "border-secondary bg-secondary/20 text-secondary" : "border-white/10 bg-white/5 text-gray-300"}`}
                onClick={() => { setType(value); openRitual(value); }}
                disabled={loading}
              >
                {label}
              </button>
            ))}
          </section>

          {error ? <div className="glass card border-red-500/30 p-4 text-sm text-red-200">{error}</div> : null}
          {result ? (
            <section className="glass card space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-400">{result.ritual.method}</p>
                  <h2 className="mt-2 text-2xl font-heading font-bold text-white">{result.ritual.title}</h2>
                </div>
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-200">Quality {result.quality.score}/{result.quality.maxScore}</span>
              </div>
              <p className="text-lg leading-7 text-gray-100">{result.ritual.summary}</p>
              <div className="rounded-2xl bg-secondary/10 p-4 text-sm text-secondary">Action: {result.ritual.action}</div>
              <div className="rounded-2xl bg-black/20 p-4 text-xs leading-5 text-gray-400">Basis: {result.ritual.basis}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button className="rounded-2xl bg-secondary/80 px-4 py-3 text-sm font-semibold text-white">{result.ritual.ctas.save}</button>
                <button className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-gray-200">{result.ritual.ctas.share}</button>
              </div>
              <p className="text-xs text-gray-500">{result.safety.disclaimer} Persistence: {result.safety.persistence}. Paid execution: {String(result.safety.paidExecution)}. AI used: {String(result.safety.aiUsed)}.</p>
            </section>
          ) : <div className="glass card p-5 text-sm text-gray-300">Opening ritual…</div>}
        </div>
      </main>
      <Navigation />
    </>
  );
}
