import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

function sha256(x: string) {
  return crypto.createHash("sha256").update(x).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "");

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const tokenHash = sha256(token);

  const rec = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!rec || rec.usedAt || rec.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Token expired or invalid" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.business.update({
      where: { id: rec.businessId },
      data: { emailVerifiedAt: new Date() }
    }),
    prisma.emailVerificationToken.update({
      where: { id: rec.id },
      data: { usedAt: new Date() }
    })
  ]);

  return NextResponse.json({ ok: true });
}
