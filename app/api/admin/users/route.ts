import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionPayload(request);
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          email: {
            contains: search,
          },
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { consultations: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        gender: user.gender,
        birthDate: user.birthDate,
        planTier: user.planTier,
        consultationCount: user._count.consultations,
        createdAt: user.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin Users Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}