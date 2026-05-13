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
    icon: "🏠",
    labelKey: "nav.tab.home",
  },
  {
    key: "reports",
    href: "/reports",
    icon: "📊",
    labelKey: "nav.tab.reports",
  },
  {
    key: "profile",
    href: "/profile",
    icon: "👤",
    labelKey: "nav.tab.profile",
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const { t, locale } = useI18n();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10"
      role="navigation"
      aria-label={locale === "zh-CN" ? "主导航" : "Main navigation"}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] ${
                isActive
                  ? "bg-secondary/20 text-secondary"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-xl" role="img" aria-hidden="true">
                {item.icon}
              </span>
              <span className="text-[10px] font-medium tracking-wide">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
