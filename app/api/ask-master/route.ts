import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "ask_master",
    freeResult: {
      conclusion: "Proceed with a small reversible move.",
      reasons: ["the signal is positive", "the commitment should stay small", "timing matters"],
      risk: "forcing certainty too early reduces response quality",
      sevenDayAction: "ask for one concrete next step",
      thirtyDayAction: "review the pattern before escalating",
    },
    lockedDeepReading: ["full reasoning", "risk boundary", "follow-up prompt"],
    paidCta: "/paywall?product=ask_master",
  });
}
