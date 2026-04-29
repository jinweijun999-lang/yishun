import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionPayload(request);
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Total users
    const totalUsers = await prisma.user.count();

    // Today's registrations
    const todayRegistrations = await prisma.user.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    // Total consultations
    const totalConsultations = await prisma.consultation.count();

    // Today's consultations
    const todayConsultations = await prisma.consultation.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    // Last 7 days registration trend
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const registrationTrend = await prisma.user.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Last 7 days consultation trend
    const consultationTrend = await prisma.consultation.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Member distribution
    const memberDistribution = await prisma.user.groupBy({
      by: ["planTier"],
      _count: { id: true },
    });

    // Process registration trend data
    const registrationByDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      registrationByDay[dateStr] = 0;
    }
    registrationTrend.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split("T")[0];
      if (registrationByDay[dateStr] !== undefined) {
        registrationByDay[dateStr] += item._count.id;
      }
    });

    // Process consultation trend data
    const consultationByDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      consultationByDay[dateStr] = 0;
    }
    consultationTrend.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split("T")[0];
      if (consultationByDay[dateStr] !== undefined) {
        consultationByDay[dateStr] += item._count.id;
      }
    });

    return NextResponse.json({
      totalUsers,
      todayRegistrations,
      totalConsultations,
      todayConsultations,
      registrationTrend: Object.entries(registrationByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      consultationTrend: Object.entries(consultationByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      memberDistribution: memberDistribution.map((item) => ({
        tier: item.planTier,
        count: item._count.id,
      })),
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}