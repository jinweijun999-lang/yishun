import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { getLocaleFromRequest, translate } from "@/lib/i18n";

export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Admin not configured" },
        { status: 500 }
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: t("errors.invalidCredentials") },
        { status: 401 }
      );
    }

    const token = await createSessionToken({ 
      sub: "admin", 
      email: adminEmail,
      isAdmin: true 
    });

    const response = NextResponse.json({ success: true });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Admin Login Error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}