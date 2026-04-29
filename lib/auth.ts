import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "fortune_session";

type SessionPayload = {
  sub: string;
  email: string;
  isAdmin?: boolean;
};

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function getSessionPayload(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  // Note: NOT httpOnly so client JavaScript can read and forward the session
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
