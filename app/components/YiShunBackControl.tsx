"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type YiShunBackControlProps = {
  href?: string;
  label: string;
  context?: string;
  ariaLabel?: string;
  fallbackHref?: string;
  icon?: ReactNode;
  className?: string;
};

const controlClass =
  "group inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-full border border-white/12 bg-[#0b0f0d]/72 px-2 py-2 pr-4 text-sm font-semibold text-[#f5efe1] shadow-[0_10px_28px_rgba(0,0,0,0.26)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d8bb75]/45 hover:bg-white/[0.075] focus:outline-none focus:ring-2 focus:ring-[#d8bb75]/55 focus:ring-offset-2 focus:ring-offset-[#080b09] active:translate-y-0 active:bg-white/[0.1]";

function BackContent({ label, context, icon }: Pick<YiShunBackControlProps, "label" | "context" | "icon">) {
  return (
    <>
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d8bb75]/30 bg-[#d8bb75]/12 text-base font-black leading-none text-[#efd187] transition group-hover:bg-[#d8bb75]/20"
        aria-hidden="true"
      >
        {icon ?? "‹"}
      </span>
      <span className="min-w-0 text-left leading-tight">
        {context && (
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#a8d8bd]">
            {context}
          </span>
        )}
        <span className="block truncate">{label}</span>
      </span>
    </>
  );
}

export default function YiShunBackControl({
  href,
  label,
  context,
  ariaLabel,
  fallbackHref = "/",
  icon,
  className = "",
}: YiShunBackControlProps) {
  const router = useRouter();
  const classes = `${controlClass} ${className}`;
  const accessibleLabel = ariaLabel ?? `${label}${context ? ` · ${context}` : ""}`;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={accessibleLabel}>
        <BackContent label={label} context={context} icon={icon} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length <= 1) {
          router.push(fallbackHref);
          return;
        }
        router.back();
      }}
      className={classes}
      aria-label={accessibleLabel}
    >
      <BackContent label={label} context={context} icon={icon} />
    </button>
  );
}
