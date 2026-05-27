"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Background from "../components/Background";
import AppBackLink from "../components/AppBackLink";
import Navigation from "../components/Navigation";
import PaymentValueMatrix from "../components/PaymentValueMatrix";
import { queueP0Analytics } from "@/lib/p0-analytics";
import { analyticsEventDictionary } from "@/lib/platform-foundation";
import { logClientError } from "@/lib/error-logging";

type Precheck = {
  authenticated?: boolean;
  step?: string;
  entitlement?: { allowed: boolean; reason: string; currentCredits: number; creditsRequired: number; chargeNow: false };
  preview?: { status: string; message: string; safetyTemplate: string };
  execution?: {
    executionId: string;
    status: "completed" | "failed" | "rolled_back";
    chargePerformed: false;
    creditConsumed?: boolean;
    creditsBefore: number;
    creditsAfter: number;
    adapter: string;
    answer?: { summary: string; reasoning: string[]; action: string; disclaimer: string };
    rollback?: { required: boolean; completed: boolean; reason: string };
    futureLiveAdapter: { contract: string; idempotencyKey: string };
  };
  noDeductionGuarantee?: string;
  error?: string;
};

export default function AiQuestionPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("Should I push a career conversation this week?");
  const [confirmed, setConfirmed] = useState(false);
  const [precheck, setPrecheck] = useState<Precheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    queueP0Analytics(analyticsEventDictionary.aiQuestionView, { source: "ai_question" });
    fetch("/api/ai-question").then((res) => res.json()).then(setPrecheck).catch(() => undefined);
  }, []);

  async function submit(event: React.FormEvent, execute = false) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (precheck?.authenticated === false) {
      router.push(`/login?returnTo=${encodeURIComponent("/ai-question")}`);
      return;
    }
    if (!trimmedQuestion || trimmedQuestion.length < 8) {
      setInputError("Ask a specific question with at least 8 characters so YiShun can answer safely.");
      queueP0Analytics("empty_input_error", { source: "ai_question", field: "question", execute });
      return;
    }
    setInputError("");
    setLoading(true);
    queueP0Analytics(
      execute ? analyticsEventDictionary.aiQuestionMockPaidExecute : confirmed ? analyticsEventDictionary.aiQuestionConfirmIntent : analyticsEventDictionary.aiQuestionPrecheck,
      { confirmed, execute }
    );
    try {
      const response = await fetch("/api/ai-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion, confirmed, execute }),
      });
      const data = await response.json();
      setPrecheck(data);
      if (!response.ok && execute) {
        queueP0Analytics(analyticsEventDictionary.aiQuestionMockRollback, { status: data.execution?.status ?? "failed" });
      }
    } catch (error) {
      await logClientError({ route: "/ai-question", message: error instanceof Error ? error.message : "AI question request failed", code: "AI_QUESTION_CLIENT_FAILED" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 pb-28 pt-8">
        <div className="mx-auto max-w-2xl space-y-5">
          <AppBackLink label="Back" context="YiShun" />
          <section className="glass card p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-secondary">AI Master Question · uses 1 Ask Credit</p>
            <h1 className="mt-3 text-3xl font-heading font-bold text-white text-glow">Ask one focused life question with 1 credit.</h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">Check your balance first, confirm explicitly, then spend 1 Ask Credit for one Love / Career / Money answer. This page never adds credits and never unlocks Full Report; credits are added only after checkout fulfillment.</p>
          </section>

          <PaymentValueMatrix isEnglish compact source="ai_question" />

          <form onSubmit={(event) => submit(event, false)} className="glass card space-y-4 p-5">
            <label className="block text-sm font-bold text-white" htmlFor="question">Your question</label>
            <textarea id="question" className="input-field min-h-[140px]" value={question} onChange={(e) => { setQuestion(e.target.value); if (inputError) setInputError(""); }} maxLength={500} aria-invalid={Boolean(inputError)} aria-describedby="question-error" />
            {inputError ? <p id="question-error" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{inputError}</p> : null}
            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
              <input className="mt-1" type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>I understand this uses 1 Ask Credit after a successful answer. If execution fails, the reserved credit is returned. Full Report unlock and membership are separate benefits.</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="btn-primary w-full" disabled={loading}>{loading ? "Checking…" : "Check entitlement"}</button>
              <button className="rounded-xl border border-secondary/40 px-5 py-3 text-sm font-bold text-secondary hover:bg-secondary/10 disabled:opacity-50" disabled={loading || !confirmed || precheck?.entitlement?.allowed !== true} onClick={(event) => submit(event, true)}>
                Ask with credit · Use 1 credit · Ask AI Master
              </button>
            </div>
            <p className="text-xs text-gray-500">Credit safety: YiShun only uses a credit after you sign in, confirm explicitly, have an available Ask Credit, and receive a successful answer. Failed attempts return the reserved credit.</p>
          </form>

          {precheck && (
            <section className="glass card space-y-3 p-5">
              <h2 className="font-heading text-xl font-bold text-white">Flow result</h2>
              {precheck.error ? <p className="text-sm text-red-200">{precheck.error}</p> : null}
              {precheck.entitlement && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-gray-500">Credits</p><p className="text-2xl font-black text-white">{precheck.entitlement.currentCredits}</p></div>
                  <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-gray-500">Reason</p><p className="text-sm text-secondary">{precheck.entitlement.reason}</p></div>
                  <div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-gray-500">Credit policy</p><p className="text-sm text-green-300">Success uses 1</p></div>
                </div>
              )}
              {precheck.preview && <p className="rounded-2xl border border-secondary/20 bg-secondary/10 p-4 text-sm text-gray-200">{precheck.preview.message}</p>}
              {precheck.execution && (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200">
                  <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white/10 px-3 py-1">{precheck.execution.executionId}</span><span className="rounded-full bg-secondary/10 px-3 py-1 text-secondary">{precheck.execution.status}</span><span className="rounded-full bg-green-500/10 px-3 py-1 text-green-200">credits {precheck.execution.creditsBefore} → {precheck.execution.creditsAfter}</span><span className="rounded-full bg-white/10 px-3 py-1">{precheck.execution.creditConsumed ? "1 credit consumed" : "credit not consumed"}</span></div>
                  {precheck.execution.answer && <><p className="font-semibold text-white">{precheck.execution.answer.summary}</p><ul className="list-disc space-y-1 pl-5 text-gray-300">{precheck.execution.answer.reasoning.map((item) => <li key={item}>{item}</li>)}</ul><p className="text-secondary">Action: {precheck.execution.answer.action}</p></>}
                  {precheck.execution.rollback && <p className="text-amber-200">Rollback: {precheck.execution.rollback.completed ? "completed" : "pending"} · {precheck.execution.rollback.reason}</p>}
                  <p className="text-xs text-gray-500">Credit-safety contract verified for this answer.</p>
                </div>
              )}
              <p className="text-xs text-gray-500">Safety: BaZi context only; no medical/legal/financial/investment or deterministic claims.</p>
            </section>
          )}
        </div>
      </main>
      <Navigation />
    </>
  );
}
