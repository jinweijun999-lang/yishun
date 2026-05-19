import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { FULL_REPORT_ADAPTER_NOTE } from "@/lib/full-report-entitlement";

export type CheckoutProduct = "report_single" | "premium_monthly" | "premium_annual" | "consultation_single";

type FulfillmentResult = {
  fulfilled: boolean;
  reason?: string;
  userId?: string;
  product?: CheckoutProduct;
  entitlementKind?: "ask_credit" | "membership" | "full_report";
  note?: string;
};

const CHECKOUT_PRODUCTS = new Set<CheckoutProduct>([
  "report_single",
  "premium_monthly",
  "premium_annual",
  "consultation_single",
]);

function isCheckoutProduct(value: unknown): value is CheckoutProduct {
  return typeof value === "string" && CHECKOUT_PRODUCTS.has(value as CheckoutProduct);
}

function getEntitlementUpdate(product: CheckoutProduct, now: Date) {
  switch (product) {
    case "premium_monthly":
      return {
        planTier: "monthly",
        consultationCredits: { increment: 5 },
        lastCreditsAccruedAt: now,
      };
    case "premium_annual":
      return {
        planTier: "annual",
        consultationCredits: { increment: 15 },
        lastCreditsAccruedAt: now,
      };
    case "consultation_single":
      return { consultationCredits: { increment: 1 } };
    case "report_single":
      return {};
  }
}

function getEntitlementKind(product: CheckoutProduct): FulfillmentResult["entitlementKind"] {
  if (product === "report_single") return "full_report";
  if (product === "premium_monthly" || product === "premium_annual") return "membership";
  return "ask_credit";
}

export function extractCheckoutEntitlement(session: Stripe.Checkout.Session): {
  userId: string | null;
  product: CheckoutProduct | null;
} {
  const metadata = session.metadata ?? {};
  const userId = session.client_reference_id || metadata.userId || null;
  const product = isCheckoutProduct(metadata.product) ? metadata.product : null;

  return { userId, product };
}

export async function fulfillCheckoutSession(params: {
  eventId: string;
  eventType: string;
  session: Stripe.Checkout.Session;
  now?: Date;
}): Promise<FulfillmentResult> {
  const { eventId, eventType, session } = params;
  const now = params.now ?? new Date();
  const { userId, product } = extractCheckoutEntitlement(session);

  if (!userId || !product) {
    return { fulfilled: false, reason: "missing_user_or_product", userId: userId ?? undefined };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return { fulfilled: false, reason: "user_not_found", userId, product };
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingEvent = await tx.stripeWebhookEvent.findUnique({ where: { id: eventId } });
    if (existingEvent) {
      return { fulfilled: true, reason: "event_already_processed" };
    }

    if (session.id) {
      const existingSession = await tx.stripeWebhookEvent.findFirst({
        where: { checkoutSessionId: session.id, status: "fulfilled" },
        select: { id: true },
      });
      if (existingSession) {
        await tx.stripeWebhookEvent.create({
          data: {
            id: eventId,
            stripeEventType: eventType,
            checkoutSessionId: session.id,
            userId,
            product,
            status: "duplicate_session",
          },
        });
        return { fulfilled: true, reason: "session_already_fulfilled" };
      }
    }

    const entitlementUpdate = getEntitlementUpdate(product, now);
    if (Object.keys(entitlementUpdate).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: entitlementUpdate,
      });
    }

    await tx.stripeWebhookEvent.create({
      data: {
        id: eventId,
        stripeEventType: eventType,
        checkoutSessionId: session.id || null,
        userId,
        product,
        status: "fulfilled",
      },
    });

    return { fulfilled: true };
  });

  return {
    ...result,
    userId,
    product,
    entitlementKind: getEntitlementKind(product),
    note: product === "report_single" ? FULL_REPORT_ADAPTER_NOTE : undefined,
  };
}
