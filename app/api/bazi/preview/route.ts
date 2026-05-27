import { NextRequest, NextResponse } from "next/server";
import { enrichBaziPreviewWithGemini } from "@/lib/gemini-bazi-enrichment";
import { buildPreviewChart, generateDailySignal, normalizeBirthProfileInput } from "@/lib/p0-astrology";
import { getSessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFullReportEntitlementForUser } from "@/lib/full-report-entitlement";

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
    const session = await getSessionPayload(request);
    const user = session
      ? await prisma.user.findUnique({ where: { id: session.sub }, select: { id: true, planTier: true, consultationCredits: true } })
      : null;
    const fullReportEntitlement = user
      ? await getFullReportEntitlementForUser(user.id, user.planTier)
      : { status: "locked" as const, source: "none" as const, reportScope: "current_profile" as const, note: "Anonymous preview is limited to a free teaser." };
    const hasFullReport = fullReportEntitlement.status === "unlocked";
    const birthProfile = {
      birthDate: input.birthDate,
      birthTime: input.birthTimeKnown ? input.birthTime : null,
      birthTimeKnown: input.birthTimeKnown,
      birthPlaceText: input.birthPlaceText,
      timezoneName: input.timezoneName,
      longitude: input.longitude,
      latitude: input.latitude,
      timezoneOffsetMinutes: input.timezoneOffsetMinutes,
    };
    const freeSummary = {
      score: dailySignal.score,
      bestFor: dailySignal.bestFor.slice(0, 3),
      bestHour: dailySignal.bestHour,
      do: dailySignal.do,
      avoid: dailySignal.avoid,
      luckyElement: dailySignal.luckyElement,
      disclaimer: dailySignal.disclaimer,
      summary: input.locale === "zh"
        ? `命中点：今天最容易把握的是 ${dailySignal.bestFor.slice(0, 2).join("、")}；把关键动作放进 ${dailySignal.bestHour}，先做 ${dailySignal.do}。`
        : `Hit signal: today is strongest for ${dailySignal.bestFor.slice(0, 2).join(" + ")}. Put the key move inside ${dailySignal.bestHour} and start with: ${dailySignal.do}.`,
    };
    const responsePayload = hasFullReport ? {
      birthProfile,
      apiContract: { timezoneOffsetMinutes: timezoneOffsetContract },
      access: {
        depth: "full_report",
        authenticated: Boolean(user),
        askCredits: user?.consultationCredits ?? 0,
        fullReportEntitlement,
        creditPolicy: "Ask credits are only for AI questions; full report access does not consume credits.",
      },
      freeSummary,
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
    } : {
      birthProfile,
      apiContract: { timezoneOffsetMinutes: timezoneOffsetContract },
      access: {
        depth: "free_teaser",
        authenticated: Boolean(user),
        askCredits: user?.consultationCredits ?? 0,
        fullReportEntitlement,
        creditPolicy: "Ask credits are only for AI questions; they do not unlock Full Report.",
      },
      freeSummary,
      trueSolarTime: preview.trueSolarTime,
      dailySignal: {
        score: dailySignal.score,
        bestFor: dailySignal.bestFor.slice(0, 3),
        do: dailySignal.do,
        avoid: dailySignal.avoid,
        bestHour: dailySignal.bestHour,
        luckyElement: dailySignal.luckyElement,
        luckyDirection: dailySignal.luckyDirection,
        disclaimer: dailySignal.disclaimer,
      },
      lockedModules: ["four_pillars", "five_elements", "ten_gods", "interpretation_basis", "deep_daily_signal", "seven_day_plan"],
      focus: typeof body.focus === "string" ? body.focus : undefined,
    };
    const allowGeminiMocks = process.env.YISHUN_ENABLE_GEMINI_MOCKS === "1" || process.env.NODE_ENV !== "production";
    const debugGeminiMock = allowGeminiMocks
      ? request.headers.get("x-yishun-gemini-mock") as "success" | "invalid-json" | "timeout" | "failure" | null
      : null;
    const ai = hasFullReport
      ? await enrichBaziPreviewWithGemini(input, responsePayload as Parameters<typeof enrichBaziPreviewWithGemini>[1], {
          // Cost control: callers must explicitly opt in. Missing/false enableAi uses rules fallback.
          enabled: body.enableAi === true,
          mockMode: debugGeminiMock,
        })
      : { status: "locked", provider: "rules", reason: "full_report_required" };

    return NextResponse.json({ ...responsePayload, ai });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PREVIEW_FAILED";
    const status = message === "INVALID_BIRTH_DATE" || message === "INVALID_BIRTH_TIME" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
