"use client";

import { useEffect, useState } from "react";

type EntitlementStatus = {
  authenticated: boolean;
  status: string;
  product?: string;
  checkoutSessionReceived?: boolean;
  entitlement?: { planTier: string; consultationCredits: number; lastUpdatedAt: string };
  recovery?: { nextCheckSeconds: number; safeToRefresh: boolean; note: string };
  message?: string;
  noSecretRead: boolean;
};

export default function CheckoutEntitlementRecovery({ product, sessionId }: { product?: string; sessionId?: string }) {
  const [status, setStatus] = useState<EntitlementStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams();
    if (product) query.set("product", product);
    if (sessionId) query.set("session_id", sessionId);

    fetch(`/api/entitlements?${query.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        try {
          window.localStorage.setItem("yishun:checkoutRecovery", JSON.stringify({ checkedAt: new Date().toISOString(), product, hasSessionId: Boolean(sessionId), status: data.status }));
        } catch {
          // Recovery display should never block checkout success UX.
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Entitlement status is temporarily unavailable. You can refresh or open Account later.");
      });

    return () => controller.abort();
  }, [product, sessionId]);

  return (
    <div className="mt-5 rounded-2xl border border-secondary/20 bg-secondary/10 p-4 text-left text-xs text-gray-300">
      <p className="font-bold uppercase tracking-[0.18em] text-secondary">Entitlement recovery</p>
      {error ? <p className="mt-2 text-amber-200">{error}</p> : null}
      {!status && !error ? <p className="mt-2">Checking current entitlement state…</p> : null}
      {status ? (
        <div className="mt-2 space-y-1">
          <p>Status: <span className="text-gray-100">{status.status}</span></p>
          <p>No live secret read: <span className="text-green-200">{status.noSecretRead ? "yes" : "no"}</span></p>
          {status.entitlement ? (
            <p>Current access: <span className="text-gray-100">{status.entitlement.planTier}</span> · credits <span className="text-gray-100">{status.entitlement.consultationCredits}</span></p>
          ) : (
            <p>{status.message || "Sign in if you need to restore this checkout on another device."}</p>
          )}
          <p className="text-gray-500">Webhook fulfillment remains the source of truth; this panel only restores visible status after redirect.</p>
        </div>
      ) : null}
    </div>
  );
}
