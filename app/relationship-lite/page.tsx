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
  const [savedMessage, setSavedMessage] = useState("");

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

  function resultShareText(current: RelationshipResult) {
    return `YiShun Relationship Lite · ${self.name} + ${partner.name}\nScore: ${current.score}\nFocus: ${current.sharedFocus}\nNext step: ${current.nextStep}\nPrivate details stay off the share text.`;
  }

  async function handleSaveResult() {
    if (!result) return;
    const saved = {
      savedAt: new Date().toISOString(),
      pair: `${self.name} + ${partner.name}`,
      score: result.score,
      sharedFocus: result.sharedFocus,
      summary: result.summary,
      nextStep: result.nextStep,
    };
    window.localStorage.setItem("yishun:relationshipLite:lastResult", JSON.stringify(saved));
    setSavedMessage("Saved on this device. Return later to revisit the pair summary.");
    queueP0Analytics("relationship_lite_save", { source: "relationship_lite", score: result.score });
  }

  async function handleShareResult() {
    if (!result) return;
    const text = resultShareText(result);
    const shareData = { title: "YiShun Relationship Lite", text, url: window.location.href };
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    const clipboard = navigator.clipboard;
    if (nav.share) {
      await nav.share(shareData).catch(() => clipboard?.writeText(text));
    } else {
      await clipboard?.writeText(text);
    }
    setSavedMessage("Share text is ready. Invite the other person without exposing birth details.");
    queueP0Analytics("relationship_lite_share", { source: "relationship_lite", score: result.score });
  }

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 pb-28 pt-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <AppBackLink label="Back" context="YiShun" />
          <section className="glass card p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-secondary">Relationship Lite · Love / friends / work</p>
            <h1 className="mt-3 text-3xl font-heading font-bold text-white text-glow">Create a private two-person match card, then invite the other side.</h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">Enter basic birth details for both sides. YiShun returns a Lite compatibility map with a score, support/friction signals, a next step, and save/share actions. Partner private data is not persisted.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Free Lite score now", "Deep compatibility locked", "Save/share for revisit"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs font-bold text-gray-200">{item}</div>
              ))}
            </div>
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
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Lite score · free preview</p>
                  <h2 className="text-4xl font-black text-secondary">{result.score}</h2>
                </div>
                <span className="rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm text-secondary">{result.sharedFocus}</span>
              </div>
              <p className="text-gray-200">{result.summary}</p>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Support signal", result.supportiveSignal],
                  ["Friction signal", result.frictionSignal],
                  ["Next step", result.nextStep],
                ].map(([label, item]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">{label}</p>
                    {item}
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <button onClick={handleSaveResult} className="rounded-2xl bg-secondary px-5 py-3 text-sm font-black text-surface hover:bg-secondary/90">Save pair result</button>
                <button onClick={handleShareResult} className="rounded-2xl border border-secondary/30 bg-secondary/10 px-5 py-3 text-sm font-black text-secondary hover:bg-secondary/15">Share / invite</button>
                <a href="/membership?source=relationship_lite_result" className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center text-sm font-black text-gray-100 hover:bg-white/10">Unlock deep match · $9.99/mo</a>
              </div>
              {savedMessage && <p className="rounded-2xl border border-secondary/30 bg-secondary/10 p-3 text-sm text-secondary">{savedMessage}</p>}
              <div className="rounded-2xl border border-[#e0bd72]/20 bg-[#e0bd72]/10 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e0bd72]">Locked deep compatibility</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {["Relationship pattern", "Conflict repair script", "Best timing to talk", "30-day revisit checklist"].map((item) => (
                    <p key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-200">🔒 {item}</p>
                  ))}
                </div>
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
