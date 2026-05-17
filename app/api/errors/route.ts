import { NextRequest, NextResponse } from "next/server";
import { buildSafeErrorLog, logServerError } from "@/lib/error-logging";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const safe = buildSafeErrorLog({
      scope: body.scope === "server" ? "server" : "client",
      route: typeof body.route === "string" ? body.route : request.nextUrl.pathname,
      message: typeof body.message === "string" ? body.message : "Unknown client error",
      code: typeof body.code === "string" ? body.code : "CLIENT_ERROR",
      traceId: typeof body.traceId === "string" ? body.traceId : undefined,
      metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
    });
    console.error("[YiShunSafeError]", JSON.stringify(safe));
    return NextResponse.json({ ok: true, traceId: safe.traceId, privacy: safe.privacy });
  } catch (error) {
    const safe = await logServerError({ scope: "server", route: "/api/errors", message: error instanceof Error ? error.message : "ERROR_LOG_FAILED", code: "ERROR_LOG_FAILED" });
    return NextResponse.json({ ok: false, traceId: safe.traceId }, { status: 400 });
  }
}
