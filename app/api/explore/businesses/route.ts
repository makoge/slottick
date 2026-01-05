import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = String(searchParams.get("city") ?? "").trim();
  const country = String(searchParams.get("country") ?? "").trim();

  // super simple filter
  const businesses = await prisma.business.findMany({
    where: {
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      name: true,
      category: true,
      city: true,
      country: true,
      website: true,
    },
    take: 24,
  });

  return NextResponse.json({ businesses });
}
