"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";

type NavItem = {
  key: string;
  href: string;
  icon: string;
  labelKey: TranslationKey;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    href: "/",
    icon: "✦",
    labelKey: "nav.tab.home",
  },
  {
    key: "reports",
    href: "/reports",
    icon: "◍",
    labelKey: "nav.tab.reports",
  },
  {
    key: "tools",
    href: "/tools",
    icon: "✧",
    labelKey: "nav.tab.tools",
  },
  {
    key: "profile",
    href: "/profile",
    icon: "◐",
    labelKey: "nav.tab.profile",
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const { t, locale } = useI18n();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2"
      role="navigation"
      aria-label={locale === "zh-CN" ? "主导航" : "Main navigation"}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-2 rounded-[1.65rem] border border-white/12 bg-[#090d0b]/88 p-2 shadow-[0_-18px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`group relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[1.15rem] px-3 py-2 text-center transition-all duration-200 ${
                isActive
                  ? "bg-[#e0bd72] text-[#10130f] shadow-[0_14px_36px_rgba(224,189,114,0.25)]"
                  : "text-gray-400 hover:-translate-y-0.5 hover:bg-white/[0.07] hover:text-gray-100 active:translate-y-0"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full text-sm font-black ${isActive ? "bg-[#10130f]/12" : "bg-white/[0.06] text-[#e0bd72] group-hover:bg-[#e0bd72]/15"}`} aria-hidden="true">
                {item.icon}
              </span>
              <span className="text-[10px] font-black tracking-wide">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
