import { NextRequest, NextResponse } from "next/server";
import { buildPreviewChart, generateDailySignal, normalizeBirthProfileInput } from "@/lib/p0-astrology";

const timezoneOffsetContract = "timezoneOffsetMinutes uses JavaScript Date.getTimezoneOffset semantics: UTC - local time. Examples: Beijing UTC+8 = -480, New York UTC-5 = 300.";

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/fortune/daily-signal",
    method: "POST",
    request: {
      birthProfile: {
        birthDate: "1996-08-08",
        birthTime: "14:28",
        birthTimeKnown: true,
        birthPlaceText: "Beijing, China",
        longitude: 116.4,
        latitude: 39.9,
        timezoneName: "Asia/Shanghai",
        timezoneOffsetMinutes: -480,
        gender: "other",
        locale: "en",
      },
      date: "2026-05-11",
      locale: "en",
      depth: "free",
    },
    notes: [
      timezoneOffsetContract,
      "P0 accepts an inline birthProfile and returns mocked rewarded-ad/paywall metadata; no real Stripe or ad SDK is called.",
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = normalizeBirthProfileInput(body.birthProfile ?? body);
    const preview = buildPreviewChart(input);
    return NextResponse.json({
      depth: body.depth === "unlocked" ? "unlocked" : "free",
      dailySignal: generateDailySignal(preview.chart, input.birthTimeKnown),
      lockedInsight: {
        title: "Your deeper pattern today",
        unlockMethod: "rewarded_ad",
        preview: "Watch a short ad to reveal how your Ten Gods pattern shapes today’s timing.",
      },
      paywall: {
        reportSku: "full_birth_chart_report",
        price: "$4.99",
        subscription: "$9.99/mo Premium",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DAILY_SIGNAL_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
