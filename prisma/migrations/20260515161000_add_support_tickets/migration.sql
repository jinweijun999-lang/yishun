-- Sprint 4 S4-2 generated migration only. Do not apply to production without operator approval.
CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'received',
  "locale" TEXT NOT NULL DEFAULT 'en',
  "messagePreview" TEXT NOT NULL,
  "messageHash" TEXT NOT NULL,
  "orderId" TEXT,
  "emailHash" TEXT,
  "emailDomain" TEXT,
  "sourceRoute" TEXT,
  "traceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportTicket_publicId_key" ON "SupportTicket"("publicId");
CREATE INDEX "SupportTicket_category_idx" ON "SupportTicket"("category");
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");
CREATE INDEX "SupportTicket_orderId_idx" ON "SupportTicket"("orderId");
