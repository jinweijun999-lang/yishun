import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth";
import { getLocaleFromRequest, translate } from "@/lib/i18n";
import {
  getAccruedCreditsUpdate,
  normalizeMembershipTier,
} from "@/lib/membership";
import type { User } from "@prisma/client";

type UserWithAccrual = User & { lastCreditsAccruedAt?: Date | null };

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const session = await getSessionPayload(request);
  if (!session) {
    return NextResponse.json({ error: t("errors.unauthorized") }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) {
      return NextResponse.json({ error: t("errors.userNotFound") }, { status: 404 });
    }

    const userWithAccrual: UserWithAccrual = user;
    const tier = normalizeMembershipTier(userWithAccrual.planTier);
    const update = getAccruedCreditsUpdate({
      tier,
      currentCredits: userWithAccrual.consultationCredits,
      lastAccruedAt: userWithAccrual.lastCreditsAccruedAt ?? null,
    });

    const data = {
      consultationCredits: update.credits + 1,
      lastCreditsAccruedAt: update.lastAccruedAt,
    };
    const updated = await prisma.user.update({
      where: { id: session.sub },
      data,
      select: { consultationCredits: true },
    });

    return NextResponse.json({ consultationCredits: updated.consultationCredits });
  } catch (error) {
    console.error("Purchase Credits Error:", error);
    return NextResponse.json(
      { error: t("errors.creditPurchaseFailed") },
      { status: 500 }
    );
  }
}
