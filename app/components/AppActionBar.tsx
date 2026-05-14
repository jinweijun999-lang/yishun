"use client";

import type { ReactNode } from "react";

type AppActionBarProps = {
  primaryLabel: string;
  onPrimary: () => void;
  primaryIcon?: ReactNode;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryIcon?: ReactNode;
  hint?: string;
  loading?: boolean;
  disabled?: boolean;
};

export default function AppActionBar({
  primaryLabel,
  onPrimary,
  primaryIcon = "→",
  secondaryLabel,
  onSecondary,
  secondaryIcon = "‹",
  hint,
  loading = false,
  disabled = false,
}: AppActionBarProps) {
  return (
    <div className="sticky bottom-4 z-50 rounded-[1.65rem] border border-white/12 bg-[#0b0f0d]/88 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:static sm:border-transparent sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
      {hint && <p className="mb-2 px-2 text-[11px] leading-4 text-gray-400 sm:hidden">{hint}</p>}
      <div className="grid gap-2 sm:flex sm:items-center sm:justify-end">
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[1.15rem] border border-white/14 bg-white/[0.045] px-5 py-3 text-sm font-extrabold text-[#efe8d7] transition hover:-translate-y-0.5 hover:border-[#e0bd72]/45 hover:bg-white/[0.075] active:translate-y-0 sm:min-w-32"
          >
            <span aria-hidden="true">{secondaryIcon}</span>
            {secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          disabled={disabled || loading}
          className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-[1.2rem] bg-[#e0bd72] px-6 py-4 text-sm font-black text-[#10130f] shadow-[0_18px_55px_rgba(224,189,114,0.28)] transition hover:-translate-y-0.5 hover:bg-[#f2d48d] hover:shadow-[0_24px_72px_rgba(224,189,114,0.34)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-56"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#10130f]/30 border-t-[#10130f]" aria-hidden="true" />}
          <span>{primaryLabel}</span>
          {!loading && <span aria-hidden="true">{primaryIcon}</span>}
        </button>
      </div>
    </div>
  );
}
