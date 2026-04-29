-- AlterTable
ALTER TABLE "User" ADD COLUMN     "consultationCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAdWatchedAt" TIMESTAMP(3),
ADD COLUMN     "planTier" TEXT NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
