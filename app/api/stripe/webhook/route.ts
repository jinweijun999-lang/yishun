import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!secretKey || !webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Stripe webhook verification is not configured for this test environment." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey);
  const payload = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    // Minimal test-mode endpoint: production fulfillment should be added after persistence is defined.
    if (event.type === "checkout.session.completed") {
      return NextResponse.json({ received: true, eventType: event.type });
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error("Stripe webhook verification failed", error);
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }
}
