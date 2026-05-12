import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidShareId } from "@/lib/share-links";

export const runtime = "nodejs";

type Params = { params: Promise<{ shareId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { shareId } = await params;
  if (!isValidShareId(shareId)) return NextResponse.json({ error: "share_not_found" }, { status: 404 });

  const share = await prisma.shareLink.findUnique({ where: { id: shareId } });
  if (!share) return NextResponse.json({ error: "share_not_found" }, { status: 404 });
  if (share.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "share_expired" }, { status: 410 });

  return NextResponse.json({
    share_id: share.id,
    card_type: share.cardType,
    template_id: share.templateId,
    locale: share.locale,
    public_payload: share.publicPayload,
    created_at: share.createdAt.toISOString(),
    expires_at: share.expiresAt.toISOString(),
  });
}
