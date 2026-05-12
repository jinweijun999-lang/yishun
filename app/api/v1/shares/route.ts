import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createShareId, normalizeCreateShareInput, shareExpiresAt } from "@/lib/share-links";

export const runtime = "nodejs";

function getBaseUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = normalizeCreateShareInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const shareId = createShareId();
  const expiresAt = shareExpiresAt();
  const input = parsed.value;

  try {
    const share = await prisma.shareLink.create({
      data: {
        id: shareId,
        anonymousId: input.anonymous_id,
        sourceScreen: input.source_screen,
        cardType: input.card_type,
        templateId: input.template_id,
        locale: input.locale ?? "en-US",
        publicPayload: input.payload,
        utmSource: input.utm?.source,
        utmMedium: input.utm?.medium,
        utmCampaign: input.utm?.campaign,
        expiresAt,
      },
    });

    const shareUrl = `${getBaseUrl(request)}/s/${share.id}`;
    return NextResponse.json(
      {
        share_id: share.id,
        share_url: shareUrl,
        deep_link: `yishun://share/${share.id}`,
        expires_at: share.expiresAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("share_create_failed", error);
    return NextResponse.json({ error: "share_create_failed" }, { status: 500 });
  }
}
