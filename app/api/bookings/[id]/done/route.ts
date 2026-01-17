import { NextResponse } from "next/server";
import { getAuthedBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({}, { status: 401 });

  await prisma.booking.update({
    where: { id, businessId: business.id },
    data: { status: "DONE" }
  });

  return NextResponse.json({ ok: true });
}

