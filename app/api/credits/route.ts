import { NextRequest, NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/auth";
import { getLocaleFromRequest, translate } from "@/lib/i18n";
import { getRequestBaseUrl } from "@/lib/public-url";
import { stripeSandboxCheckoutAdapter } from "@/lib/stripe-sandbox-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSiteUrl(request: NextRequest) {
  return getRequestBaseUrl(request.nextUrl.origin);
}

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const session = await getSessionPayload(request);
  if (!session) {
    return NextResponse.json({ error: t("errors.unauthorized") }, { status: 401 });
  }

  const siteUrl = getSiteUrl(request);
  const checkout = await stripeSandboxCheckoutAdapter.createCheckout({
    userId: session.sub,
    product: "consultation_single",
    quantity: 1,
    successUrl: `${siteUrl}/checkout/sandbox?product=consultation_single`,
    cancelUrl: `${siteUrl}/checkout/cancel?product=consultation_single`,
    idempotencyKey: `credit_purchase:${session.sub}:${Date.now()}`,
    mode: "mock",
  });

  return NextResponse.json({
    url: checkout.redirectUrl,
    code: "checkout_sandbox_pending",
    checkoutSessionId: checkout.checkoutSessionId,
    chargePerformed: false,
    fulfillment: "pending_webhook_not_fulfilled",
    message: "Credit checkout is temporarily unavailable. No card charge or credit balance change was made.",
  });
}
