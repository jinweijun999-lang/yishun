import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/auth";

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

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!secretKey.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY must be a Stripe secret key.");
  }
  return secretKey;
}

function getStripeCheckoutMode(secretKey: string) {
  const configuredMode = process.env.YISHUN_STRIPE_MODE ?? "test";
  if (configuredMode !== "test" && configuredMode !== "live") {
    throw new Error("YISHUN_STRIPE_MODE must be either test or live.");
  }

  const isLiveKey = secretKey.startsWith("sk_live_");
  const isTestKey = secretKey.startsWith("sk_test_");

  if (configuredMode === "test" && isLiveKey) {
    throw new Error("Live Stripe key is blocked while YISHUN_STRIPE_MODE=test.");
  }

  if (configuredMode === "live") {
    const acknowledged = process.env.STRIPE_LIVE_CUTOVER_ACK === "I_UNDERSTAND_STRIPE_LIVE_CHARGES";
    if (!isLiveKey || !acknowledged) {
      throw new Error("Live Stripe checkout requires sk_live_* and STRIPE_LIVE_CUTOVER_ACK=I_UNDERSTAND_STRIPE_LIVE_CHARGES.");
    }
  }

  if (!isLiveKey && !isTestKey) {
    throw new Error("STRIPE_SECRET_KEY must be an explicit sk_test_* or sk_live_* key.");
  }

  return configuredMode;
}

function getStripePriceId(priceEnv: string) {
  const priceId = process.env[priceEnv];
  if (!priceId) return null;
  if (!priceId.startsWith("price_")) {
    throw new Error(`${priceEnv} must be a Stripe Price ID.`);
  }
  return priceId;
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
  const sessionPayload = await getSessionPayload(request);
  const userId =
    sessionPayload?.sub ?? (typeof clientReferenceId === "string" ? clientReferenceId : undefined);

  if (!isCheckoutProduct(product)) {
    return NextResponse.json({ error: "Unsupported checkout product." }, { status: 400 });
  }

  const productConfig = CHECKOUT_PRODUCTS[product];

  let secretKey: string | null;
  let priceId: string | null;
  let stripeMode: "test" | "live";
  try {
    secretKey = getStripeSecretKey();
    priceId = getStripePriceId(productConfig.priceEnv);
    stripeMode = secretKey ? getStripeCheckoutMode(secretKey) : "test";
  } catch (error) {
    console.error("Stripe checkout configuration is invalid", error);
    return NextResponse.json(
      {
        error: "Checkout is temporarily unavailable. Please try again later.",
        code: "checkout_config_invalid",
      },
      { status: 503 }
    );
  }

  const missingEnv = [
    !secretKey ? "STRIPE_SECRET_KEY" : null,
    !priceId ? productConfig.priceEnv : null,
  ].filter(Boolean);

  if (missingEnv.length > 0 || !secretKey || !priceId) {
    return NextResponse.json(
      {
        error: "Checkout is temporarily unavailable. Please try again later.",
        code: "checkout_config_missing",
        missingEnv,
      },
      { status: 503 }
    );
  }

  const siteUrl = getSiteUrl(request);
  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: productConfig.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product=${product}`,
      cancel_url: `${siteUrl}/checkout/cancel?product=${product}`,
      client_reference_id: userId,
      metadata: {
        product,
        userId: userId ?? "",
        label: productConfig.label,
        priceId,
        stripeMode,
        source: stripeMode === "live" ? "yishun_web_live_checkout" : "yishun_web_test_checkout",
      },
      subscription_data:
        productConfig.mode === "subscription"
          ? {
              metadata: {
                product,
                userId: userId ?? "",
                priceId,
                stripeMode,
                source: stripeMode === "live" ? "yishun_web_live_checkout" : "yishun_web_test_checkout",
              },
            }
          : undefined,
      payment_intent_data:
        productConfig.mode === "payment"
          ? {
              metadata: {
                product,
                userId: userId ?? "",
                priceId,
                stripeMode,
                source: stripeMode === "live" ? "yishun_web_live_checkout" : "yishun_web_test_checkout",
              },
            }
          : undefined,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed", error);
    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 502 }
    );
  }
}
