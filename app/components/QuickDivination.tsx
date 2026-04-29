"use client";

import Link from "next/link";
import { useI18n } from "./LocaleProvider";

type QuickDivinationProps = {
  isLoggedIn?: boolean;
};

export default function QuickDivination({ isLoggedIn = false }: QuickDivinationProps) {
  const { t } = useI18n();

  const handleClick = () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      window.location.href = "/login?returnTo=/tools";
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-secondary/10 to-accent/5 border border-secondary/20 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl" role="img" aria-hidden="true">
            🔮
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-heading font-bold text-white">
            {t("quickDivination.title")}
          </h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            {t("quickDivination.description")}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          href="/tools"
          className="flex-1 px-4 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm text-center hover:bg-secondary transition-colors"
        >
          {t("quickDivination.startBtn")}
        </Link>
        <Link
          href="/tools/sample"
          className="px-4 py-3 rounded-xl border border-white/20 text-gray-300 text-sm hover:bg-white/5 transition-colors"
        >
          {t("quickDivination.trySample")}
        </Link>
      </div>
    </div>
  );
}
