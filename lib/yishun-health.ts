import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";

export type YiShunCheckStatus = "ok" | "missing" | "not_configured" | "error" | "configured";

export type YiShunHealthSnapshot = {
  ok: boolean;
  service: "yishun";
  version: string;
  time: string;
  checks: {
    app: "ok";
    database: YiShunCheckStatus;
    stripe: YiShunCheckStatus;
    analytics: YiShunCheckStatus;
  };
};

function configured(...values: Array<string | undefined>) {
  return values.every((value) => Boolean(value && value.trim()));
}

function configStatus(...values: Array<string | undefined>): YiShunCheckStatus {
  if (values.length > 0 && configured(...values)) return "configured";
  return process.env.NODE_ENV === "production" ? "missing" : "not_configured";
}

function releaseMarkerVersion() {
  try {
    const version = readFileSync(path.join(process.cwd(), ".yishun-release-sha"), "utf8").trim();
    return version || undefined;
  } catch {
    return undefined;
  }
}

function appVersion() {
  return (
    process.env.YISHUN_RELEASE_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.NEXT_PUBLIC_APP_VERSION ||
    releaseMarkerVersion() ||
    "unknown"
  );
}

async function databaseStatus(): Promise<YiShunCheckStatus> {
  if (!process.env.DATABASE_URL) return process.env.NODE_ENV === "production" ? "missing" : "not_configured";

  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

export async function getYiShunHealthSnapshot(): Promise<YiShunHealthSnapshot> {
  const database = await databaseStatus();
  const stripe = configStatus(
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_PRICE_REPORT_SINGLE,
  );
  const analytics = configured(process.env.NEXT_PUBLIC_YISHUN_ANALYTICS_ENDPOINT) ||
    configured(process.env.YISHUN_ANALYTICS_FILE) ||
    configured(process.env.YISHUN_ANALYTICS_FILES) ||
    configured(process.env.YISHUN_ANALYTICS_DIR)
    ? "configured"
    : configStatus();
  const production = process.env.NODE_ENV === "production";
  const databaseOk = database === "ok" || (!production && database === "not_configured");
  const stripeOk = stripe === "configured" || (!production && stripe === "not_configured");
  const analyticsOk = analytics === "configured" || (!production && analytics === "not_configured");

  return {
    ok: databaseOk && stripeOk && analyticsOk,
    service: "yishun",
    version: appVersion(),
    time: new Date().toISOString(),
    checks: {
      app: "ok",
      database,
      stripe,
      analytics,
    },
  };
}
