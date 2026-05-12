import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getEntitlementUpdate(product, now) {
  switch (product) {
    case "premium_monthly":
      return {
        planTier: "monthly",
        consultationCredits: { increment: 5 },
        lastCreditsAccruedAt: now,
      };
    case "consultation_single":
      return { consultationCredits: { increment: 1 } };
    case "report_single":
      return { consultationCredits: { increment: 1 } };
    default:
      throw new Error(`Unsupported smoke product: ${product}`);
  }
}

async function fulfill({ eventId, eventType, checkoutSessionId, userId, product, now = new Date() }) {
  return prisma.$transaction(async (tx) => {
    const existingEvent = await tx.stripeWebhookEvent.findUnique({ where: { id: eventId } });
    if (existingEvent) return { fulfilled: true, reason: "event_already_processed" };

    const existingSession = await tx.stripeWebhookEvent.findFirst({
      where: { checkoutSessionId, status: "fulfilled" },
      select: { id: true },
    });
    if (existingSession) {
      await tx.stripeWebhookEvent.create({
        data: { id: eventId, stripeEventType: eventType, checkoutSessionId, userId, product, status: "duplicate_session" },
      });
      return { fulfilled: true, reason: "session_already_fulfilled" };
    }

    await tx.user.update({ where: { id: userId }, data: getEntitlementUpdate(product, now) });
    await tx.stripeWebhookEvent.create({
      data: { id: eventId, stripeEventType: eventType, checkoutSessionId, userId, product, status: "fulfilled" },
    });

    return { fulfilled: true };
  });
}

async function main() {
  const suffix = Date.now().toString(36);
  const user = await prisma.user.create({
    data: {
      email: `stripe-smoke-${suffix}@example.test`,
      passwordHash: "not-used-in-smoke",
    },
  });

  const premium = await fulfill({
    eventId: `evt_smoke_premium_${suffix}`,
    eventType: "checkout.session.completed",
    checkoutSessionId: `cs_smoke_premium_${suffix}`,
    userId: user.id,
    product: "premium_monthly",
    now: new Date("2026-05-12T00:00:00.000Z"),
  });
  const consultation = await fulfill({
    eventId: `evt_smoke_consult_${suffix}`,
    eventType: "checkout.session.completed",
    checkoutSessionId: `cs_smoke_consult_${suffix}`,
    userId: user.id,
    product: "consultation_single",
  });
  const duplicate = await fulfill({
    eventId: `evt_smoke_consult_duplicate_${suffix}`,
    eventType: "checkout.session.completed",
    checkoutSessionId: `cs_smoke_consult_${suffix}`,
    userId: user.id,
    product: "consultation_single",
  });

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const events = await prisma.stripeWebhookEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!premium.fulfilled || !consultation.fulfilled || !duplicate.fulfilled) {
    throw new Error(`Expected all smoke fulfillments to resolve: ${JSON.stringify({ premium, consultation, duplicate })}`);
  }
  if (duplicate.reason !== "session_already_fulfilled") {
    throw new Error(`Expected duplicate session guard, got ${duplicate.reason}`);
  }
  if (updated.planTier !== "monthly") {
    throw new Error(`Expected monthly planTier, got ${updated.planTier}`);
  }
  if (updated.consultationCredits !== 6) {
    throw new Error(`Expected 6 consultation credits, got ${updated.consultationCredits}`);
  }
  if (events.length !== 3 || events.filter((event) => event.status === "fulfilled").length !== 2) {
    throw new Error(`Expected 2 fulfilled events plus 1 duplicate_session event, got ${JSON.stringify(events)}`);
  }

  console.log(JSON.stringify({
    ok: true,
    userId: user.id,
    planTier: updated.planTier,
    consultationCredits: updated.consultationCredits,
    webhookEvents: events.map((event) => ({ id: event.id, product: event.product, status: event.status })),
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
