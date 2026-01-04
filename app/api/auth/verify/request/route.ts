import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendVerifyEmail } from "@/lib/email";

function sha256(x: string) {
  return crypto.createHash("sha256").update(x).digest("hex");
}

function getLocaleFromReferer(req: Request) {
  const ref = req.headers.get("referer");
  if (!ref) return "en";
  try {
    const { pathname } = new URL(ref);
    const seg = pathname.split("/").filter(Boolean)[0];
    return seg || "en";
  } catch {
    return "en";
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const business = await prisma.business.findUnique({ where: { ownerEmail: email } });

  // anti-enumeration
  if (!business) return NextResponse.json({ ok: true });
  if (business.emailVerifiedAt) return NextResponse.json({ ok: true });

  // ✅ cooldown (60s)
  const recent = await prisma.emailVerificationToken.findFirst({
    where: { businessId: business.id, usedAt: null },
    orderBy: { createdAt: "desc" }
  });

  if (recent && recent.createdAt.getTime() > Date.now() - 60_000) {
    return NextResponse.json({ ok: true });
  }

  // ✅ cleanup expired
  await prisma.emailVerificationToken.deleteMany({
    where: {
      businessId: business.id,
      usedAt: null,
      expiresAt: { lt: new Date() }
    }
  });

  const token = crypto.randomUUID();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.emailVerificationToken.create({
    data: { tokenHash, expiresAt, businessId: business.id }
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const locale = getLocaleFromReferer(req);
  const verifyLink = `${baseUrl}/${locale}/verify-email?token=${encodeURIComponent(token)}`;

  try {
    await sendVerifyEmail({ to: business.ownerEmail, verifyLink });
  } catch (e) {
    console.error("[verify-request] email send failed", e);
  }

  return NextResponse.json({ ok: true });
}
