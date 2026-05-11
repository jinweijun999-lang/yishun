"use client";

import { useState } from "react";

export type StripeCheckoutProduct =
  | "report_single"
  | "premium_monthly"
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
  fallbackLabel = "Stripe Test Checkout is not configured yet. Add test env vars to enable payment redirect.",
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const startCheckout = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setMessage("");
    onStart?.();

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, clientReferenceId }),
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setMessage(data.error || fallbackLabel);
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error("Failed to start Stripe checkout", error);
      setMessage("Unable to start Stripe Test Checkout. Please try again later.");
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
