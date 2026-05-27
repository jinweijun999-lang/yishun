import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "missing" | "not_configured" | "error";

function configured(...values: Array<string | undefined>) {
  return values.every((value) => Boolean(value && value.trim()));
}

function appVersion() {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.NEXT_PUBLIC_APP_VERSION ||
    "unknown"
  );
}
async function databaseStatus(): Promise<CheckStatus> {
  if (!process.env.DATABASE_URL) return process.env.NODE_ENV === "production" ? "missing" : "not_configured";

  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

export async function GET() {
  const database = await databaseStatus();
  const stripe = configured(
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_PRICE_REPORT_SINGLE,
  )
    ? "configured"
    : "not_configured";
  const analytics = configured(process.env.NEXT_PUBLIC_YISHUN_ANALYTICS_ENDPOINT) ||
    configured(process.env.YISHUN_ANALYTICS_FILE)
    ? "configured"
    : "not_configured";

  const ok = database === "ok" || database === "not_configured";
  const status = ok ? 200 : 503;

  return NextResponse.json(
    {
      ok,
      service: "yishun",
      version: appVersion(),
      time: new Date().toISOString(),
      checks: {
        app: "ok",
        database,
        stripe,
        analytics,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
