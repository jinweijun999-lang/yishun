import { NextRequest, NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildBaziProfile, computeFourPillars, type Gender } from "@/lib/bazi";
import { getLocaleFromRequest, translate } from "@/lib/i18n";
import {
  getAccruedCreditsUpdate,
  normalizeMembershipTier,
} from "@/lib/membership";
import type { User } from "@prisma/client";

type UserWithAccrual = User & { lastCreditsAccruedAt?: Date | null };

function isGender(value: string | null): value is Gender {
  return value === "male" || value === "female" || value === "other";
}

async function syncMembershipCredits(user: UserWithAccrual): Promise<UserWithAccrual> {
  const tier = normalizeMembershipTier(user.planTier);
  const update = getAccruedCreditsUpdate({
    tier,
    currentCredits: user.consultationCredits,
    lastAccruedAt: user.lastCreditsAccruedAt ?? null,
  });
  if (!update.changed) {
    return user;
  }
  const data = {
    consultationCredits: update.credits,
    lastCreditsAccruedAt: update.lastAccruedAt,
  };
  return prisma.user.update({
    where: { id: user.id },
    data,
  });
}

export async function GET(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const session = await getSessionPayload(request);
  if (!session) {
    return NextResponse.json({ error: t("errors.unauthorized") }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) {
    return NextResponse.json({ error: t("errors.userNotFound") }, { status: 404 });
  }

  const syncedUser = await syncMembershipCredits(user);

  const tier = normalizeMembershipTier(syncedUser.planTier);
  const hasMemberAccess = tier !== "free";
  const hasSingleConsultation = (syncedUser.consultationCredits ?? 0) > 0;
  if (!hasMemberAccess && !hasSingleConsultation) {
    return NextResponse.json({ error: t("errors.baziLocked") }, { status: 403 });
  }

  if (!syncedUser.birthDate || !syncedUser.birthTime || !isGender(syncedUser.gender)) {
    return NextResponse.json(
      { error: t("errors.profileIncomplete") },
      { status: 400 }
    );
  }

  const bazi = computeFourPillars({
    birthDate: syncedUser.birthDate,
    birthTime: syncedUser.birthTime,
    gender: syncedUser.gender,
    longitude: syncedUser.longitude,
    latitude: syncedUser.latitude,
    timezoneOffsetMinutes: syncedUser.timezoneOffsetMinutes ?? undefined,
    timezoneName: syncedUser.timezoneName ?? undefined,
  });
  const baziProfile = buildBaziProfile(bazi);

  return NextResponse.json({
    chart: {
      birthDate: syncedUser.birthDate,
      birthTime: syncedUser.birthTime,
      gender: syncedUser.gender,
      timezoneName: syncedUser.timezoneName,
      timezoneOffsetMinutes: syncedUser.timezoneOffsetMinutes,
      trueSolarTime: bazi.trueSolarTime
        ? {
            date: bazi.trueSolarTime.date,
            time: bazi.trueSolarTime.time,
            offsetMinutes: bazi.trueSolarTime.offsetMinutes,
          }
        : null,
      fourPillars: bazi.fourPillars,
      dayMaster: baziProfile.day_master,
      elementsBalance: baziProfile.elements_balance,
      zodiac: bazi.fourPillars.year.branch.zodiac,
    },
  });
}
