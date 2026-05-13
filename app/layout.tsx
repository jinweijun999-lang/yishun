import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
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
      title: "YiShun | Eastern Astrology for Better Timing",
      description: "Turn your birth time into today’s decision signal with BaZi, Five Elements, and true solar time.",
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://11263.com"),
      applicationName: "YiShun",
      appleWebApp: {
        capable: true,
        title: "YiShun",
        statusBarStyle: "black-translucent",
      },
      formatDetection: {
        telephone: false,
      },
      icons: {
        icon: [{ url: "/icons/yishun-icon.svg", type: "image/svg+xml" }],
        apple: [{ url: "/icons/yishun-icon.svg", type: "image/svg+xml" }],
      },
      openGraph: {
        title: "YiShun | Eastern Astrology for Better Timing",
        description: "Create a free BaZi chart and today’s practical timing signal in 60 seconds.",
        type: "website",
        url: "/",
      },
      twitter: {
        card: "summary_large_image",
        title: "YiShun | BaZi Daily Astrology",
        description: "Free BaZi chart, true solar time, Five Elements, and daily timing signals.",
      },
      keywords: [
        "BaZi calculator",
        "Chinese astrology birth chart",
        "Four Pillars of Destiny",
        "daily horoscope",
        "Eastern astrology",
      ],
    };
  }

  return {
    title: "易顺｜东方时机决策信号",
    description: "输入出生信息，获取基于八字、五行与真太阳时的每日时机参考。",
    keywords: ["八字", "五行", "真太阳时", "今日时机", "易顺"],
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090a0a" },
    { media: "(prefers-color-scheme: light)", color: "#6f9a84" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    defaultLocale: DEFAULT_LOCALE,
  });
  return getMetadata(locale);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = resolveLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    defaultLocale: DEFAULT_LOCALE,
  });

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className="font-body antialiased min-h-screen" suppressHydrationWarning>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
