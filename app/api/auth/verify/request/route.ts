import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendVerifyEmail } from "@/lib/email";

function sha256(x: string) {
  return crypto.createHash("sha256").update(x).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const business = await prisma.business.findUnique({ where: { ownerEmail: email } });
  if (!business) return NextResponse.json({ ok: true }); // no enumeration
  if (business.emailVerifiedAt) return NextResponse.json({ ok: true });

  const token = crypto.randomUUID();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.emailVerificationToken.create({
    data: { tokenHash, expiresAt, businessId: business.id }
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyLink = `${baseUrl}/en/verify-email?token=${encodeURIComponent(token)}`;

  await sendVerifyEmail({ to: business.ownerEmail, verifyLink });

  return NextResponse.json({ ok: true });
}
