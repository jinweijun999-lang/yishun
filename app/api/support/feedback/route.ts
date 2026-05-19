import { NextRequest, NextResponse } from "next/server";
import { normalizeSupportTicket } from "@/lib/support-feedback";
import { supportTicketStore } from "@/lib/support-ticket-store";
import { logServerError } from "@/lib/error-logging";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = normalizeSupportTicket(body);
    const ticket = await supportTicketStore.create(input);
    return NextResponse.json({ ok: true, ticket, adapter: "support-ticket-persistence-v1" });
  } catch (error) {
    const safe = await logServerError({
      scope: "server",
      route: "/api/support/feedback",
      message: error instanceof Error ? error.message : "SUPPORT_FEEDBACK_FAILED",
      code: "SUPPORT_FEEDBACK_FAILED",
    });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "SUPPORT_FEEDBACK_FAILED", traceId: safe.traceId }, { status: 400 });
  }
}
