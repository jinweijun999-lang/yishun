import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth";
import { getLocaleFromRequest, translate } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const session = await getSessionPayload(request);
  if (!session) {
    return NextResponse.json({ error: t("errors.unauthorized") }, { status: 401 });
  }

  try {
    const consultations = await prisma.consultation.findMany({
      where: {
        userId: session.sub,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ consultations });
  } catch (error) {
    console.error("Fetch Consultations Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultation history" },
      { status: 500 }
    );
  }
}
