import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidShareId } from "@/lib/share-links";

export const runtime = "nodejs";

type Params = { params: Promise<{ shareId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { shareId } = await params;
  if (!isValidShareId(shareId)) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.shareLink.updateMany({
    where: { id: shareId, expiresAt: { gt: new Date() } },
    data: { generateClickCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
