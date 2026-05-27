import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth";
import { getLocaleFromRequest, translate } from "@/lib/i18n";
import {
  getAccruedCreditsUpdate,
  normalizeMembershipTier,
} from "@/lib/membership";
import type { User } from "@prisma/client";
import { getFullReportEntitlementForUser } from "@/lib/full-report-entitlement";

type UserWithAccrual = User & { lastCreditsAccruedAt?: Date | null };

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
    if (request.nextUrl.searchParams.get("silent") === "1") {
      return NextResponse.json({ authenticated: false, error: t("errors.unauthorized") });
    }
    return NextResponse.json({ error: t("errors.unauthorized") }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) {
    return NextResponse.json({ error: t("errors.userNotFound") }, { status: 404 });
  }

  const syncedUser = await syncMembershipCredits(user);

  const fullReportEntitlement = await getFullReportEntitlementForUser(syncedUser.id, syncedUser.planTier);

  return NextResponse.json({
    authenticated: true,
    profile: {
      email: syncedUser.email,
      birthDate: syncedUser.birthDate,
      birthTime: syncedUser.birthTime,
      gender: syncedUser.gender,
      longitude: syncedUser.longitude,
      latitude: syncedUser.latitude,
      timezoneOffsetMinutes: syncedUser.timezoneOffsetMinutes,
      timezoneName: syncedUser.timezoneName,
      planTier: syncedUser.planTier,
      consultationCredits: syncedUser.consultationCredits,
      fullReportEntitlement,
      lastAdWatchedAt: syncedUser.lastAdWatchedAt,
      lastCreditsAccruedAt: syncedUser.lastCreditsAccruedAt,
    },
  });
}

export async function PUT(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const session = await getSessionPayload(request);
  if (!session) {
    return NextResponse.json({ error: t("errors.unauthorized") }, { status: 401 });
  }

  try {
    const {
      birthDate,
      birthTime,
      gender,
      longitude,
      latitude,
      timezoneOffsetMinutes,
      timezoneName,
    } = await request.json();

    const user = await prisma.user.update({
      where: { id: session.sub },
      data: {
        birthDate: typeof birthDate === "string" ? birthDate : null,
        birthTime: typeof birthTime === "string" ? birthTime : null,
        gender: typeof gender === "string" ? gender : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
        latitude: Number.isFinite(latitude) ? latitude : null,
        timezoneOffsetMinutes: Number.isFinite(timezoneOffsetMinutes)
          ? timezoneOffsetMinutes
          : null,
        timezoneName: typeof timezoneName === "string" ? timezoneName : null,
      },
    });

    const syncedUser = await syncMembershipCredits(user);

    const fullReportEntitlement = await getFullReportEntitlementForUser(syncedUser.id, syncedUser.planTier);

    return NextResponse.json({
      profile: {
        email: syncedUser.email,
        birthDate: syncedUser.birthDate,
        birthTime: syncedUser.birthTime,
        gender: syncedUser.gender,
        longitude: syncedUser.longitude,
        latitude: syncedUser.latitude,
        timezoneOffsetMinutes: syncedUser.timezoneOffsetMinutes,
        timezoneName: syncedUser.timezoneName,
        planTier: syncedUser.planTier,
        consultationCredits: syncedUser.consultationCredits,
        fullReportEntitlement,
        lastAdWatchedAt: syncedUser.lastAdWatchedAt,
        lastCreditsAccruedAt: syncedUser.lastCreditsAccruedAt,
      },
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json(
      { error: t("errors.profileUpdateFailed") },
      { status: 500 }
    );
  }
}
