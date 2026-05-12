-- P1-1 Share Landing: public, non-PII share snapshots for invite回流页.
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "anonymousId" TEXT,
    "sourceScreen" TEXT NOT NULL,
    "cardType" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "publicPayload" JSONB NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "generateClickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShareLink_anonymousId_idx" ON "ShareLink"("anonymousId");
CREATE INDEX "ShareLink_sourceScreen_idx" ON "ShareLink"("sourceScreen");
CREATE INDEX "ShareLink_cardType_idx" ON "ShareLink"("cardType");
CREATE INDEX "ShareLink_expiresAt_idx" ON "ShareLink"("expiresAt");
