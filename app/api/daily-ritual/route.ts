import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "daily_ritual",
    freeResult: {
      omenStrength: 82,
      summary: "Move with one clean message, not scattered attempts.",
      bestTime: "15:00-17:00",
      shareText: "YiShun daily ritual: one clean message today.",
    },
    lockedDeepReading: ["deep sign text", "7-day timing", "30-day avoid windows"],
    paidCta: "/paywall?product=daily_ritual",
  });
}
