import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { LocaleProvider } from "./components/LocaleProvider";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  resolveLocale,
  type Locale,
} from "@/lib/i18n";
import "./globals.css";

function getMetadata(locale: Locale): Metadata {
  if (locale === "en") {
    return {
      title: "Daily Fortune | Fortune Teller",
      description: "Enter your birth details to receive a daily fortune reading.",
      keywords: [
        "fortune",
        "Ba Zi",
        "Four Pillars of Destiny",
        "daily fortune",
        "AI fortune",
      ],
    };
  }

  return {
    title: "今日运势 | Fortune Teller",
    description: "输入您的出生日期和时间，获取今日运势预测",
    keywords: ["运势", "算命", "星座", "今日运势", "AI算命"],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const headerList = await headers();
  const locale = resolveLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
  });
  return getMetadata(locale);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerList = await headers();
  const locale = resolveLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
    defaultLocale: DEFAULT_LOCALE,
  });

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className="font-body antialiased" suppressHydrationWarning>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
