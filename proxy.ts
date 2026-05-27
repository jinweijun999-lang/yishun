import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";

function isSupportedLocale(value: string | null | undefined) {
  if (!value) {
    return false;
  }
  return SUPPORTED_LOCALES.includes(value as (typeof SUPPORTED_LOCALES)[number]);
}

export function proxy(request: NextRequest) {
  const cookieLocale = normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value);
  if (isSupportedLocale(cookieLocale)) {
    return NextResponse.next();
  }

  // Do not auto-select zh-CN from Accept-Language for first-time overseas
  // visitors. A saved locale cookie still takes precedence above.
  const locale = DEFAULT_LOCALE;

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
