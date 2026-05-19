"use client";

import { useCallback, useEffect, useState } from "react";
import { queueP0Analytics } from "@/lib/p0-analytics";
import { YISHUN_EVENTS, trackYiShunEvent } from "@/lib/p1-analytics";

type EntitlementStatus = {
  authenticated: boolean;
  status: string;
  product?: string;
  checkoutSessionReceived?: boolean;
  entitlement?: {
    planTier: string;
    consultationCredits: number;
    askCredits?: number;
    fullReport?: { status: "locked" | "unlocked" | "pending"; source: string; note: string };
    lastUpdatedAt: string;
  };
  recovery?: { nextCheckSeconds: number; safeToRefresh: boolean; note: string };
  message?: string;
  noSecretRead: boolean;
};

function isUnlocked(status: EntitlementStatus | null, product?: string) {
  if (!status?.entitlement) return false;
  if (product === "report_single") return status.entitlement.fullReport?.status === "unlocked";
  if (product === "consultation_single") return status.entitlement.consultationCredits > 0;
  if (product === "premium_monthly" || product === "premium_annual") return status.entitlement.planTier === "monthly" || status.entitlement.planTier === "annual";
  return false;
}

export default function CheckoutEntitlementRecovery({ product, sessionId }: { product?: string; sessionId?: string }) {
  const [status, setStatus] = useState<EntitlementStatus | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const checkEntitlement = useCallback(async (reason: "initial" | "manual" | "poll" = "manual", signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (product) query.set("product", product);
    if (sessionId) query.set("session_id", sessionId);

    setChecking(true);
    setError("");
    try {
      const response = await fetch(`/api/entitlements?${query.toString()}`, { signal });
      const data = (await response.json()) as EntitlementStatus;
      setStatus(data);
      setAttempt((value) => value + 1);
      queueP0Analytics("entitlement_recovery_check", { product, reason, status: data.status, unlocked: isUnlocked(data, product) });
      if (isUnlocked(data, product)) {
        trackYiShunEvent(YISHUN_EVENTS.UNLOCK_SUCCESS, { product, source: "checkout_entitlement_recovery", reason });
      }
      try {
        window.localStorage.setItem("yishun:checkoutRecovery", JSON.stringify({ checkedAt: new Date().toISOString(), product, hasSessionId: Boolean(sessionId), status: data.status, unlocked: isUnlocked(data, product) }));
      } catch {
        // Recovery display should never block checkout success UX.
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Entitlement status is temporarily unavailable. You can refresh or open Account later.");
    } finally {
      setChecking(false);
    }
  }, [product, sessionId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void checkEntitlement("initial", controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [checkEntitlement]);

  useEffect(() => {
    if (isUnlocked(status, product) || attempt >= 3) return;
    const delayMs = Math.max(2, status?.recovery?.nextCheckSeconds ?? 3) * 1000;
    const timer = window.setTimeout(() => void checkEntitlement("poll"), delayMs);
    return () => window.clearTimeout(timer);
  }, [attempt, checkEntitlement, product, status]);

  return (
    <div className="mt-5 rounded-2xl border border-secondary/20 bg-secondary/10 p-4 text-left text-xs text-gray-300">
      <p className="font-bold uppercase tracking-[0.18em] text-secondary">Entitlement recovery</p>
      {error ? <p className="mt-2 text-amber-200">{error}</p> : null}
      {!status && !error ? <p className="mt-2">Checking current entitlement state…</p> : null}
      {status ? (
        <div className="mt-2 space-y-2">
          <p>Status: <span className="text-gray-100">{status.status}</span></p>
          <p>No live secret read: <span className="text-green-200">{status.noSecretRead ? "yes" : "no"}</span></p>
          {status.entitlement ? (
            <div className="space-y-1">
              <p>Current access: <span className="text-gray-100">{status.entitlement.planTier}</span> · ask credits <span className="text-gray-100">{status.entitlement.askCredits ?? status.entitlement.consultationCredits}</span></p>
              {status.entitlement.fullReport ? <p>Full Report: <span className={status.entitlement.fullReport.status === "unlocked" ? "text-green-200" : "text-amber-200"}>{status.entitlement.fullReport.status}</span></p> : null}
            </div>
          ) : (
            <p>{status.message || "Sign in if you need to restore this checkout on another device."}</p>
          )}
          <button
            type="button"
            onClick={() => void checkEntitlement("manual")}
            disabled={checking}
            className="mt-2 rounded-xl border border-secondary/30 px-3 py-2 text-xs font-bold text-secondary hover:bg-secondary/10 disabled:opacity-50"
          >
            {checking ? "Checking…" : "I completed checkout — recheck unlock"}
          </button>
          <p className="text-gray-500">Webhook fulfillment remains the source of truth; this safe loop only polls visible entitlement state and never grants credits directly.</p>
        </div>
      ) : null}
    </div>
  );
}
