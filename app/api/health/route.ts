import { NextResponse } from "next/server";
import { getYiShunHealthSnapshot } from "@/lib/yishun-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getYiShunHealthSnapshot();
  const status = health.ok ? 200 : 503;

  return NextResponse.json(
    health,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
