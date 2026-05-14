"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  translate,
  type Locale,
  type TranslationKey,
  normalizeLocale,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`));
  if (!match) {
    return null;
  }
  const value = match.split("=")[1];
  return normalizeLocale(value ?? null);
}

function detectClientLocale(): Locale {
  if (typeof window !== "undefined") {
    const queryLocale = normalizeLocale(new URLSearchParams(window.location.search).get("lang"));
    if (queryLocale) {
      return queryLocale;
    }
  }
  const cookieLocale = readLocaleCookie();
  if (cookieLocale) {
    return cookieLocale;
  }
  if (typeof navigator !== "undefined") {
    const fromNavigator = normalizeLocale(navigator.language);
    if (fromNavigator) {
      return fromNavigator;
    }
  }
  return DEFAULT_LOCALE;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    () => initialLocale ?? detectClientLocale() ?? DEFAULT_LOCALE
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale)) {
      return;
    }
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return context;
}
