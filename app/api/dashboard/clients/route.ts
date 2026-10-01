// app/api/dashboard/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  try {
    const business = await getAuthedBusiness().catch(() => null);
    if (!business?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clients = await prisma.clientProfile.findMany({
      where: {
        businessId: business.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        allergies: true,
        generalNotes: true,
        createdAt: true,
        updatedAt: true,
        records: {
          take: 1,
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            serviceName: true,
            staff: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            records: true,
            photos: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ clients });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load clients" },
      { status: 500 },
    );
  }
}
