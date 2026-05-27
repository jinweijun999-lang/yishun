import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth";
import { getLocaleFromRequest, translate } from "@/lib/i18n";

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  if (process.env.YISHUN_ENABLE_REWARDED_ADS !== "1") {
    return NextResponse.json({
      error: "REWARDED_ADS_DISABLED",
      message: "Rewarded ads are currently unavailable; this route does not grant credits or paid access.",
    }, { status: 410 });
  }

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
