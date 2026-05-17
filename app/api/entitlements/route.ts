import { NextRequest, NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeMembershipTier } from "@/lib/membership";
import { getFullReportEntitlementForUser } from "@/lib/full-report-entitlement";

export async function GET(request: NextRequest) {
  const session = await getSessionPayload(request);
  const checkoutSessionReceived = Boolean(request.nextUrl.searchParams.get("session_id"));
  const product = request.nextUrl.searchParams.get("product") || "unknown";

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      checkoutSessionReceived,
      product,
      status: checkoutSessionReceived ? "pending_login_or_webhook" : "anonymous",
      message: "Sign in to restore entitlement after checkout. No Stripe secret is read by this status endpoint.",
      noSecretRead: true,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, planTier: true, consultationCredits: true, updatedAt: true },
  });

  if (!user) {
    return NextResponse.json({ authenticated: true, status: "user_not_found", noSecretRead: true }, { status: 404 });
  }

  const fullReportEntitlement = await getFullReportEntitlementForUser(user.id, user.planTier);

  return NextResponse.json({
    authenticated: true,
    checkoutSessionReceived,
    product,
    status: checkoutSessionReceived ? "webhook_pending_or_fulfilled" : "current",
    entitlement: {
      planTier: normalizeMembershipTier(user.planTier),
      consultationCredits: user.consultationCredits,
      askCredits: user.consultationCredits,
      fullReport: fullReportEntitlement,
      lastUpdatedAt: user.updatedAt.toISOString(),
    },
    recovery: {
      nextCheckSeconds: 3,
      safeToRefresh: true,
      note: "Webhook fulfillment is idempotent; this endpoint only reads current entitlement state.",
    },
    noSecretRead: true,
  });
}
