import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { getLocaleFromRequest, translate } from "@/lib/i18n";

export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: t("errors.emailPasswordRequired") },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: t("errors.invalidCredentials") },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: t("errors.invalidCredentials") },
        { status: 401 }
      );
    }

    const token = await createSessionToken({ sub: user.id, email: user.email });
    const response = NextResponse.json({
      user: {
        email: user.email,
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        gender: user.gender,
      },
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Login Error:", error);
    const locale = getLocaleFromRequest(request);
    return NextResponse.json(
      { error: translate(locale, "errors.loginFailed") },
      { status: 500 }
    );
  }
}
