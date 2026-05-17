import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    freeIncludes: ["one preview", "share CTA", "one next action"],
    paidUnlocks: ["deep reading", "7/30/90 day trend", "saved history", "follow-up prompts"],
    notIncluded: ["hidden charges", "direct credit grants", "private data exposure"],
    checkoutMode: "sandbox_until_stripe_configured",
  });
}
