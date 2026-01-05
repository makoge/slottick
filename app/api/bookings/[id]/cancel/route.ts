import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const business = await getAuthedBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }

  // Only allow cancelling own booking
  const booking = await prisma.booking.findFirst({
    where: { id, businessId: business.id },
    select: { id: true, status: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json({ ok: true });
  }

  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
 