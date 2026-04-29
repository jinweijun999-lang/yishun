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

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { email: true },
          },
        },
      }),
      prisma.consultation.count(),
    ]);

    return NextResponse.json({
      consultations: consultations.map((c) => ({
        id: c.id,
        userEmail: c.user.email,
        question: c.question,
        response: c.response,
        createdAt: c.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin Consultations Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultations" },
      { status: 500 }
    );
  }
}