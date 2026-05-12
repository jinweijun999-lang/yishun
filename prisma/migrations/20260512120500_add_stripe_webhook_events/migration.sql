-- Persist processed Stripe webhook events so checkout.session.completed is idempotent.
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventType" TEXT NOT NULL,
    "checkoutSessionId" TEXT,
    "userId" TEXT,
    "product" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StripeWebhookEvent_checkoutSessionId_idx" ON "StripeWebhookEvent"("checkoutSessionId");
CREATE INDEX "StripeWebhookEvent_userId_idx" ON "StripeWebhookEvent"("userId");
