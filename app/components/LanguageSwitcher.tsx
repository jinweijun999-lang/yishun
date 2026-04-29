"use client";

import { useI18n } from "./LocaleProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

const LABELS: Record<Locale, { label: string; short: string }> = {
  "zh-CN": { label: "中文", short: "中文" },
  en: { label: "English", short: "EN" },
};

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-xs text-gray-400">
      <span className="hidden sm:inline">{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        className="rounded-xl bg-surface/60 border border-white/10 px-3 py-2 text-xs text-white outline-none transition-all duration-300"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {SUPPORTED_LOCALES.map((value) => (
          <option key={value} value={value}>
            {LABELS[value].label}
          </option>
        ))}
      </select>
      <span className="sm:hidden text-gray-400">{LABELS[locale].short}</span>
    </label>
  );
}
