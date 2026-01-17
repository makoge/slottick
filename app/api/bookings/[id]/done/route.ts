import { NextResponse } from "next/server";
import { getOwnerOr401 } from "@/lib/auth"; // whatever you use
import { db } from "@/lib/db"; // your prisma/db

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerOr401();
  if (!owner) return NextResponse.json({}, { status: 401 });

  await db.booking.update({
    where: { id: params.id, ownerId: owner.id },
    data: { status: "DONE" }
  });

  return NextResponse.json({ ok: true });
}
