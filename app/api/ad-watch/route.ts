import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth";
import { getLocaleFromRequest, translate } from "@/lib/i18n";

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const session = await getSessionPayload(request);
  if (!session) {
    return NextResponse.json({ error: t("errors.unauthorized") }, { status: 401 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.sub },
      data: { lastAdWatchedAt: new Date() },
      select: { lastAdWatchedAt: true },
    });

    return NextResponse.json({
      lastAdWatchedAt: updated.lastAdWatchedAt,
    });
  } catch (error) {
    console.error("Ad Watch Error:", error);
    return NextResponse.json(
      { error: t("errors.adWatchFailed") },
      { status: 500 }
    );
  }
}
