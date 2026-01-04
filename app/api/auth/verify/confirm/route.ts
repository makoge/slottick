import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

function sha256(x: string) {
  return crypto.createHash("sha256").update(x).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const tokenHash = sha256(token);

  const rec = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash }
  });

  if (!rec || rec.usedAt || rec.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Token expired or invalid" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const b = await tx.business.findUnique({
      where: { id: rec.businessId },
      select: { emailVerifiedAt: true }
    });

    // mark token used no matter what (prevents replay)
    await tx.emailVerificationToken.update({
      where: { id: rec.id },
      data: { usedAt: new Date() }
    });

    if (!b?.emailVerifiedAt) {
      await tx.business.update({
        where: { id: rec.businessId },
        data: { emailVerifiedAt: new Date() }
      });
    }

    // cleanup other unused tokens for this business
    await tx.emailVerificationToken.deleteMany({
      where: {
        businessId: rec.businessId,
        usedAt: null,
        expiresAt: { lt: new Date() }
      }
    });
  });

  return NextResponse.json({ ok: true });
}
