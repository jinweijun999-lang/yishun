import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { fulfillCheckoutSession } from "@/lib/stripe-entitlements";
import { recordServerAnalyticsEvent } from "@/lib/server-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripeTestConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return null;
  }
  if (!secretKey.startsWith("sk_test_") || !webhookSecret.startsWith("whsec_")) {
    throw new Error("Stripe webhook must use test mode secret and signing secret.");
  }

  return { secretKey, webhookSecret };
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let config: { secretKey: string; webhookSecret: string } | null;
  try {
    config = getStripeTestConfig();
  } catch (error) {
    console.error("Stripe webhook configuration is invalid", error);
    return NextResponse.json(
      { error: "Stripe webhook is not configured for Stripe test mode." },
      { status: 503 }
    );
  }

  if (!config) {
    return NextResponse.json(
      { error: "Stripe webhook verification is not configured for this test environment." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(config.secretKey);
  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
  } catch (error) {
    console.error("Stripe webhook verification failed", error);
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await fulfillCheckoutSession({
        eventId: event.id,
        eventType: event.type,
        session,
      });

      const status = result.fulfilled ? 200 : 400;
      return NextResponse.json(
        { received: true, eventType: event.type, entitlement: result },
        { status }
      );
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error("Stripe webhook fulfillment failed", {
      stripeEventId: event.id,
      stripeEventType: event.type,
      error,
    });
    await recordServerAnalyticsEvent({
      event: "webhook_failed",
      stripeEventType: event.type,
      webhookStatus: "exception",
      reason: "fulfillment_exception",
    });
    return NextResponse.json({ error: "Stripe webhook fulfillment failed." }, { status: 500 });
  }
}
