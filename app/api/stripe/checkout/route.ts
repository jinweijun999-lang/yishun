import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutProduct = "report_single" | "premium_monthly" | "consultation_single";

const CHECKOUT_PRODUCTS: Record<
  CheckoutProduct,
  { priceEnv: string; mode: "payment" | "subscription"; label: string }
> = {
  report_single: {
    priceEnv: "STRIPE_PRICE_REPORT_SINGLE",
    mode: "payment",
    label: "YiShun Full Timing Report",
  },
  premium_monthly: {
    priceEnv: "STRIPE_PRICE_PREMIUM_MONTHLY",
    mode: "subscription",
    label: "YiShun Premium Monthly",
  },
  consultation_single: {
    priceEnv: "STRIPE_PRICE_CONSULTATION_SINGLE",
    mode: "payment",
    label: "YiShun Single Consultation",
  },
};

function isCheckoutProduct(value: unknown): value is CheckoutProduct {
  return typeof value === "string" && value in CHECKOUT_PRODUCTS;
}

function getSiteUrl(request: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  const product = (body as { product?: unknown }).product;
  const clientReferenceId = (body as { clientReferenceId?: unknown }).clientReferenceId;

  if (!isCheckoutProduct(product)) {
    return NextResponse.json({ error: "Unsupported checkout product." }, { status: 400 });
  }

  const productConfig = CHECKOUT_PRODUCTS[product];
  const missingEnv = ["STRIPE_SECRET_KEY", productConfig.priceEnv].filter(
    (name) => !process.env[name]
  );

  if (missingEnv.length > 0) {
    return NextResponse.json(
      {
        error: `Stripe Test Checkout is not configured. Set ${missingEnv.join(", ")} to enable this CTA.`,
        missingEnv,
      },
      { status: 503 }
    );
  }

  const siteUrl = getSiteUrl(request);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: productConfig.mode,
      line_items: [{ price: process.env[productConfig.priceEnv] as string, quantity: 1 }],
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product=${product}`,
      cancel_url: `${siteUrl}/checkout/cancel?product=${product}`,
      client_reference_id: typeof clientReferenceId === "string" ? clientReferenceId : undefined,
      metadata: {
        product,
        label: productConfig.label,
        source: "yishun_web_test_checkout",
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed", error);
    return NextResponse.json(
      { error: "Unable to create Stripe Test Checkout session." },
      { status: 502 }
    );
  }
}
