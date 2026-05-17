"use client";

import { useState } from "react";
import Background from "../components/Background";
import AppBackLink from "../components/AppBackLink";
import Navigation from "../components/Navigation";
import PaymentValueMatrix from "../components/PaymentValueMatrix";
import { queueP0Analytics } from "@/lib/p0-analytics";
import { analyticsEventDictionary } from "@/lib/platform-foundation";

type RelationshipResult = {
  score: number;
  summary: string;
  sharedFocus: string;
  supportiveSignal: string;
  frictionSignal: string;
  nextStep: string;
  privacyNote: string;
  trace: Array<{ label: string; value: string }>;
};

const defaultSelf = { name: "You", birthDate: "1994-05-16", birthTime: "08:30", gender: "other" };
const defaultPartner = { name: "Partner", birthDate: "1996-09-12", birthTime: "20:00", gender: "other" };

export default function RelationshipLitePage() {
  const [self, setSelf] = useState(defaultSelf);
  const [partner, setPartner] = useState(defaultPartner);
  const [result, setResult] = useState<RelationshipResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    queueP0Analytics(analyticsEventDictionary.relationshipLiteSubmit, { source: "relationship_lite" });
    try {
      const response = await fetch("/api/relationship-lite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ self, partner }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Relationship Lite failed");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Relationship Lite failed");
    } finally {
      setLoading(false);
    }
  }

  function update(target: "self" | "partner", key: keyof typeof defaultSelf, value: string) {
    const setter = target === "self" ? setSelf : setPartner;
    setter((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 pb-28 pt-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <AppBackLink label="Back" context="YiShun" />
          <section className="glass card p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-secondary">Relationship Lite</p>
            <h1 className="mt-3 text-3xl font-heading font-bold text-white text-glow">Two-person timing summary</h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">Enter basic birth details for both sides. YiShun returns a Lite compatibility map and does not persist partner private data.</p>
          </section>

          <PaymentValueMatrix isEnglish compact source="relationship_lite" />

          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            {(["self", "partner"] as const).map((target) => {
              const data = target === "self" ? self : partner;
              return (
                <section key={target} className="glass card space-y-3 p-5">
                  <h2 className="font-heading text-xl font-bold text-white">{target === "self" ? "Your profile" : "Other person"}</h2>
                  <input className="input-field" value={data.name} onChange={(e) => update(target, "name", e.target.value)} placeholder="Name / nickname" />
                  <input className="input-field" type="date" value={data.birthDate} onChange={(e) => update(target, "birthDate", e.target.value)} required />
                  <input className="input-field" type="time" value={data.birthTime} onChange={(e) => update(target, "birthTime", e.target.value)} required />
                  <select className="input-field" value={data.gender} onChange={(e) => update(target, "gender", e.target.value)}>
                    <option value="other">Other / not specified</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </section>
              );
            })}
            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-400">Privacy: partner details are sent only to the calculation API response; no persistence path is used.</p>
              <button className="btn-primary" disabled={loading}>{loading ? "Calculating…" : "Generate relationship summary"}</button>
            </div>
          </form>

          {error && <div className="glass card border-red-500/30 p-4 text-sm text-red-200">{error}</div>}
          {result && (
            <section className="glass card space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Lite score</p>
                  <h2 className="text-4xl font-black text-secondary">{result.score}</h2>
                </div>
                <span className="rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm text-secondary">{result.sharedFocus}</span>
              </div>
              <p className="text-gray-200">{result.summary}</p>
              <div className="grid gap-3 md:grid-cols-3">
                {[result.supportiveSignal, result.frictionSignal, result.nextStep].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">{item}</div>)}
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Traceable basis</p>
                <div className="grid gap-2 sm:grid-cols-2">{result.trace.map((item) => <p key={item.label} className="text-xs text-gray-300"><span className="text-gray-500">{item.label}: </span>{item.value}</p>)}</div>
              </div>
              <p className="text-xs text-gray-500">{result.privacyNote}</p>
            </section>
          )}
        </div>
      </main>
      <Navigation />
    </>
  );
}
