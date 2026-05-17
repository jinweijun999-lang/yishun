import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "compatibility",
    freeResult: {
      score: 76,
      attraction: "high",
      conflict: "tempo",
      advice: "Send one low-pressure invitation instead of asking for a definition now.",
    },
    lockedDeepReading: ["30/90 day trend", "repair scripts", "best timing to advance"],
    paidCta: "/paywall?product=compatibility",
  });
}
