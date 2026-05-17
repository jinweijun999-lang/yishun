import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "profile_card",
    freeResult: {
      archetype: "Wood Seeker",
      strengths: ["fast pattern reader", "growth-minded"],
      blindSpot: "committing before the signal is stable",
      shareText: "My YiShun destiny card: Wood Seeker.",
    },
    lockedDeepReading: ["career module", "wealth module", "love module", "opportunity windows"],
    paidCta: "/paywall?product=profile_card",
  });
}
