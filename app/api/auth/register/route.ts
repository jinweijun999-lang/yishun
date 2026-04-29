import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { getLocaleFromRequest, translate } from "@/lib/i18n";

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeGender(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.toLowerCase();
  return normalized === "male" || normalized === "female" || normalized === "other"
    ? normalized
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const {
      email,
      password,
      birthDate,
      birthTime,
      gender,
      longitude,
      latitude,
      timezoneOffsetMinutes,
      timezoneName,
    } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: t("errors.emailPasswordRequired") },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: t("errors.invalidEmail") },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: t("errors.passwordTooShort") },
        { status: 400 }
      );
    }

    const normalizedGender = normalizeGender(gender);
    if (!isNonEmptyString(birthDate) || !isNonEmptyString(birthTime) || !normalizedGender) {
      return NextResponse.json(
        { error: t("errors.birthRequired") },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: t("errors.emailTaken") },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        birthDate,
        birthTime,
        gender: normalizedGender,
        longitude: Number.isFinite(longitude) ? longitude : null,
        latitude: Number.isFinite(latitude) ? latitude : null,
        timezoneOffsetMinutes: Number.isFinite(timezoneOffsetMinutes)
          ? timezoneOffsetMinutes
          : null,
        timezoneName: typeof timezoneName === "string" ? timezoneName : null,
      },
    });

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
    console.error("Register Error:", error);
    const locale = getLocaleFromRequest(request);
    return NextResponse.json(
      { error: translate(locale, "errors.registerFailed") },
      { status: 500 }
    );
  }
}
