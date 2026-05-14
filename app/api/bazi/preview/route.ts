import { NextRequest, NextResponse } from "next/server";
import { enrichBaziPreviewWithGemini } from "@/lib/gemini-bazi-enrichment";
import { buildPreviewChart, generateDailySignal, normalizeBirthProfileInput } from "@/lib/p0-astrology";

export const dynamic = "force-dynamic";

const timezoneOffsetContract = "timezoneOffsetMinutes uses JavaScript Date.getTimezoneOffset semantics: UTC - local time. Examples: Beijing UTC+8 = -480, New York UTC-5 = 300.";

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/bazi/preview",
    method: "POST",
    request: {
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
    notes: [
      timezoneOffsetContract,
      "Unknown birth time should send birthTimeKnown=false; the API estimates with 12:00 and marks precision lower.",
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = normalizeBirthProfileInput(body);
    const preview = buildPreviewChart(input);
    const dailySignal = generateDailySignal(preview.chart, input.birthTimeKnown, input.locale);
    const responsePayload = {
      birthProfile: {
        birthDate: input.birthDate,
        birthTime: input.birthTimeKnown ? input.birthTime : null,
        birthTimeKnown: input.birthTimeKnown,
        birthPlaceText: input.birthPlaceText,
        timezoneName: input.timezoneName,
        longitude: input.longitude,
        latitude: input.latitude,
        timezoneOffsetMinutes: input.timezoneOffsetMinutes,
      },
      apiContract: { timezoneOffsetMinutes: timezoneOffsetContract },
      trueSolarTime: preview.trueSolarTime,
      fourPillars: preview.chart.fourPillars,
      dayMaster: preview.profile.day_master,
      elementsBalance: preview.elementsBalance,
      dominantElement: preview.dominantElement,
      missingElement: preview.missingElement,
      favorableElement: preview.favorableElement,
      tenGodPattern: preview.tenGodPattern,
      interpretation: preview.interpretation,
      dailySignal,
      focus: typeof body.focus === "string" ? body.focus : undefined,
    };
    const debugGeminiMock = process.env.YISHUN_ENABLE_GEMINI_MOCKS === "1"
      ? request.headers.get("x-yishun-gemini-mock") as "success" | "invalid-json" | "timeout" | "failure" | null
      : null;
    const ai = await enrichBaziPreviewWithGemini(input, responsePayload, {
      // Cost control: callers must explicitly opt in. Missing/false enableAi uses rules fallback.
      enabled: body.enableAi === true,
      mockMode: debugGeminiMock,
    });

    return NextResponse.json({ ...responsePayload, ai });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PREVIEW_FAILED";
    const status = message === "INVALID_BIRTH_DATE" || message === "INVALID_BIRTH_TIME" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
