import { NextRequest, NextResponse } from "next/server";
import { buildPreviewChart, generateDailySignal, normalizeBirthProfileInput } from "@/lib/p0-astrology";
import { analyticsEventDictionary, promptTemplates, remoteConfigDefaults } from "@/lib/platform-foundation";
import { logServerError } from "@/lib/error-logging";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = normalizeBirthProfileInput(body);
    const preview = buildPreviewChart(input);
    const signal = generateDailySignal(preview.chart, input.birthTimeKnown, input.locale ?? "en");
    const today = new Date().toISOString().slice(0, 10);
    const pillars = preview.chart.fourPillars;

    return NextResponse.json({
      event: analyticsEventDictionary.dailyTimingSubmit,
      remoteConfig: { dailyTimingTraceEnabled: remoteConfigDefaults.dailyTimingTraceEnabled },
      signal,
      trace: {
        date: today,
        input: {
          birthDate: input.birthDate,
          birthTime: input.birthTimeKnown ? input.birthTime : "unknown → noon fallback",
          timezoneName: input.timezoneName ?? "not supplied",
          birthPlaceText: input.birthPlaceText ?? "not supplied",
          locale: input.locale ?? "en",
        },
        basis: {
          pillars: {
            year: pillars.year.pillar,
            month: pillars.month.pillar,
            day: pillars.day.pillar,
            hour: pillars.hour.pillar,
          },
          dayMaster: preview.profile.day_master,
          elementBalance: preview.elementsBalance,
          dominantElement: preview.dominantElement,
          missingElement: preview.missingElement,
          favorableElement: preview.favorableElement,
          tenGodPattern: preview.tenGodPattern,
          trueSolarTime: preview.trueSolarTime,
        },
        explanation: {
          fiveElements: `Dominant ${preview.dominantElement}, missing ${preview.missingElement}, recommended balancing element ${preview.favorableElement}.`,
          dayCourse: signal.why,
          actionAdvice: { do: signal.do, avoid: signal.avoid, bestHour: signal.bestHour, bestFor: signal.bestFor },
          confidence: input.birthTimeKnown ? "higher: exact birth time supplied" : "medium: birth time unknown, noon fallback used",
        },
        model: promptTemplates.dailyTimingTrace,
      },
    });
  } catch (error) {
    const safe = await logServerError({
      scope: "server",
      route: "/api/daily-timing",
      message: error instanceof Error ? error.message : "DAILY_TIMING_FAILED",
      code: "DAILY_TIMING_FAILED",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DAILY_TIMING_FAILED", traceId: safe.traceId },
      { status: 400 }
    );
  }
}
