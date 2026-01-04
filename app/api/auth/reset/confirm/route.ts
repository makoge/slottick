import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function sha256(x: string) {
  return crypto.createHash("sha256").update(x).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  const newPassword = String(body.newPassword ?? "").trim();

  if (!token || newPassword.length < 6) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const tokenHash = sha256(token);

  const rec = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { business: true }
  });

  if (!rec || rec.usedAt || rec.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Token expired or invalid" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: rec.businessId },
      data: { passwordHash, failedLoginCount: 0, lockUntil: null }
    });

    await tx.passwordResetToken.update({
      where: { id: rec.id },
      data: { usedAt: new Date() }
    });

    // ✅ invalidate all sessions after password reset
    await tx.session.deleteMany({
      where: { businessId: rec.businessId }
    });
  });

  return NextResponse.json({ ok: true });
}
