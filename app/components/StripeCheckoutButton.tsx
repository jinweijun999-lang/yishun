"use client";

import { useState } from "react";
import { queueP0Analytics } from "@/lib/p0-analytics";

export type StripeCheckoutProduct =
  | "report_single"
  | "premium_monthly"
  | "premium_annual"
  | "consultation_single";

type StripeCheckoutButtonProps = {
  product: StripeCheckoutProduct;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  clientReferenceId?: string;
  onStart?: () => void;
  fallbackLabel?: string;
};

export default function StripeCheckoutButton({
  product,
  children,
  className = "",
  disabled = false,
  clientReferenceId,
  onStart,
  fallbackLabel = "Checkout is not configured yet. Please try again later.",
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const startCheckout = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setMessage("");
    queueP0Analytics("checkout_start", { product, source: "stripe_checkout_button", clientReferenceId: clientReferenceId ? "present" : "missing" });
    onStart?.();

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, clientReferenceId }),
      });
      const data = (await response.json()) as { url?: string; error?: string; code?: string };

      if (!response.ok || !data.url) {
        queueP0Analytics("checkout_failed", {
          product,
          source: "stripe_checkout_button",
          responseStatus: response.status,
          code: data.code ?? "missing_checkout_url",
        });
        setMessage(
          data.code === "checkout_config_missing" || data.code === "checkout_config_invalid"
            ? fallbackLabel
            : data.error || fallbackLabel,
        );
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error("Failed to start Stripe checkout", error);
      queueP0Analytics("checkout_failed", {
        product,
        source: "stripe_checkout_button",
        reason: "network_or_client_exception",
      });
      setMessage("Unable to start checkout. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={startCheckout}
        disabled={disabled || isLoading}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isLoading ? "Opening checkout…" : children}
      </button>
      {message && (
        <p className="text-xs leading-5 text-amber-200" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
