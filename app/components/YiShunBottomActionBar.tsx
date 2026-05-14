"use client";

import type { ReactNode } from "react";

export type YiShunActionState = "default" | "loading" | "success" | "error";

type YiShunAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  state?: YiShunActionState;
  disabled?: boolean;
  disabledReason?: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
};

type YiShunBottomActionBarProps = {
  primary: YiShunAction;
  secondary: YiShunAction;
  tertiary: YiShunAction;
  statusText?: string;
  errorText?: string | null;
  className?: string;
};

function Spinner({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 ${
        tone === "dark" ? "border-[#10130f]/30 border-t-[#10130f]" : "border-white/30 border-t-white"
      }`}
      aria-hidden="true"
    />
  );
}

function buttonLabel(action: YiShunAction) {
  if (action.state === "loading") return action.loadingLabel ?? action.label;
  if (action.state === "success") return action.successLabel ?? action.label;
  if (action.state === "error") return action.errorLabel ?? action.label;
  return action.label;
}

function ActionButton({ action, variant }: { action: YiShunAction; variant: "primary" | "secondary" | "tertiary" }) {
  const isLoading = action.state === "loading";
  const isDisabled = action.disabled || isLoading;
  const label = buttonLabel(action);
  const base =
    "inline-flex min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#d8bb75]/55 focus:ring-offset-2 focus:ring-offset-[#080b09] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";
  const styles = {
    primary:
      "flex-[1.45] bg-[#d8bb75] text-[#10130f] font-black shadow-[0_14px_38px_rgba(216,187,117,0.25)] hover:-translate-y-0.5 hover:bg-[#efd187] hover:shadow-[0_18px_48px_rgba(216,187,117,0.3)]",
    secondary:
      "flex-1 border border-white/14 bg-white/[0.055] text-[#f5efe1] font-bold hover:-translate-y-0.5 hover:border-[#d8bb75]/40 hover:bg-white/[0.085]",
    tertiary:
      "flex-[0.9] border border-transparent bg-transparent text-[#bdb5a6] font-bold hover:-translate-y-0.5 hover:bg-white/[0.055] hover:text-[#f5efe1]",
  };
  const stateStyles =
    action.state === "success"
      ? " ring-1 ring-emerald-300/50"
      : action.state === "error"
        ? " ring-1 ring-red-300/50"
        : "";

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={isDisabled}
      aria-label={action.ariaLabel ?? label}
      aria-disabled={isDisabled || undefined}
      title={isDisabled ? action.disabledReason : undefined}
      className={`${base} ${styles[variant]} ${stateStyles}`}
    >
      {isLoading ? <Spinner tone={variant === "primary" ? "dark" : "light"} /> : <span className="text-[18px] leading-none" aria-hidden="true">{action.icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function YiShunBottomActionBar({
  primary,
  secondary,
  tertiary,
  statusText,
  errorText,
  className = "",
}: YiShunBottomActionBarProps) {
  const disabledReason = primary.disabled && primary.disabledReason ? primary.disabledReason : null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#090d0b]/90 px-4 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_54px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:static md:mt-6 md:border md:border-white/10 md:bg-white/[0.035] md:p-3 md:shadow-none ${className}`}
      role="region"
      aria-label="YiShun page actions"
    >
      {(errorText || disabledReason || statusText) && (
        <p
          className={`mb-2 px-1 text-[11px] leading-4 ${
            errorText ? "text-red-200" : disabledReason ? "text-[#efd187]" : "text-[#bdb5a6]"
          }`}
        >
          {errorText ?? disabledReason ?? statusText}
        </p>
      )}
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <ActionButton action={tertiary} variant="tertiary" />
        <ActionButton action={secondary} variant="secondary" />
        <ActionButton action={primary} variant="primary" />
      </div>
    </div>
  );
}
