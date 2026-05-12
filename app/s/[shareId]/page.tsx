import type { Metadata } from "next";
import Background from "@/app/components/Background";
import { prisma } from "@/lib/prisma";
import { isValidShareId } from "@/lib/share-links";
import type { PublicSharePayload } from "@/lib/share-links";
import ShareLandingClient from "./ShareLandingClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "A YiShun insight was shared with you",
  description: "Open a public YiShun timing card and generate your own daily card.",
};

type PageProps = { params: Promise<{ shareId: string }> };

function toPublicPayload(value: unknown): PublicSharePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.title !== "string" || typeof record.theme !== "string" || typeof record.summary !== "string") return null;
  return record as PublicSharePayload;
}

export default async function ShareLandingPage({ params }: PageProps) {
  const { shareId } = await params;
  let payload: PublicSharePayload | null = null;
  let status: "ready" | "missing" | "expired" = "missing";
  let createdAt: string | undefined;

  if (isValidShareId(shareId)) {
    const share = await prisma.shareLink.findUnique({ where: { id: shareId } });
    if (share) {
      if (share.expiresAt < new Date()) {
        status = "expired";
      } else {
        status = "ready";
        payload = toPublicPayload(share.publicPayload);
        createdAt = share.createdAt.toISOString();
        await prisma.shareLink.update({ where: { id: shareId }, data: { clickCount: { increment: 1 } } }).catch(() => undefined);
      }
    }
  }

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_34%)]">
        <ShareLandingClient shareId={shareId} payload={payload} status={status} createdAt={createdAt} />
      </main>
    </>
  );
}
