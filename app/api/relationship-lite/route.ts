import { NextRequest, NextResponse } from "next/server";
import { computeRelationshipLite } from "@/lib/relationship-lite";
import { analyticsEventDictionary, productConfig } from "@/lib/platform-foundation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = computeRelationshipLite(body.self ?? {}, body.partner ?? {});
    return NextResponse.json({
      product: productConfig.id,
      event: analyticsEventDictionary.relationshipLiteSubmit,
      persistsPartnerPrivateData: false,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "RELATIONSHIP_LITE_FAILED" },
      { status: 400 }
    );
  }
}
