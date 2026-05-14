"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type AppBackLinkProps = {
  href?: string;
  label: string;
  context?: string;
  icon?: ReactNode;
  className?: string;
};

const baseClass =
  "group inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/12 bg-black/25 px-2.5 py-2 pr-4 text-sm font-bold text-[#f5efe1] shadow-[0_12px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e0bd72]/45 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#e0bd72]/40 active:translate-y-0";

function Content({ label, context, icon }: Pick<AppBackLinkProps, "label" | "context" | "icon">) {
  return (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#e0bd72]/35 bg-[#e0bd72]/15 text-[#f3d28a] transition group-hover:bg-[#e0bd72]/25" aria-hidden="true">
        {icon ?? "‹"}
      </span>
      <span className="leading-tight">
        {context && <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#a8d8bd]">{context}</span>}
        <span>{label}</span>
      </span>
    </>
  );
}

export default function AppBackLink({ href, label, context, icon, className = "" }: AppBackLinkProps) {
  const router = useRouter();
  const classes = `${baseClass} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label}>
        <Content label={label} context={context} icon={icon} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => router.back()} className={classes} aria-label={label}>
      <Content label={label} context={context} icon={icon} />
    </button>
  );
}
