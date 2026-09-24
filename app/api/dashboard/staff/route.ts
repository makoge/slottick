import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

export async function GET() {
  try {
    const business = await getAuthedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.staff.findMany({
      where: { businessId: business.id },
      include: {
        services: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ staff });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const business = await getAuthedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, title, serviceIds } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newStaff = await prisma.staff.create({
      data: {
        businessId: business.id,
        name: name.trim(),
        title: title?.trim() || null,
        services: {
          connect: (serviceIds || []).map((id: string) => ({ id })),
        },
      },
      include: {
        services: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ staff: newStaff });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
