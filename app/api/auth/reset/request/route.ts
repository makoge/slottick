import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendResetPasswordEmail } from "@/lib/email";

function sha256(x: string) {
  return crypto.createHash("sha256").update(x).digest("hex");
}

function getLocaleFromPath(pathname: string) {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg || "en";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { ownerEmail: email }
  });

  // Always return ok (anti-enumeration)
  if (!business) return NextResponse.json({ ok: true });

  // ✅ simple cooldown: if a token was created in last 60s, do nothing
  const recent = await prisma.passwordResetToken.findFirst({
    where: { businessId: business.id, usedAt: null },
    orderBy: { createdAt: "desc" }
  });

  if (recent && recent.createdAt.getTime() > Date.now() - 60_000) {
    return NextResponse.json({ ok: true });
  }

  // ✅ clean old unused tokens (optional but nice)
  await prisma.passwordResetToken.deleteMany({
    where: {
      businessId: business.id,
      usedAt: null,
      expiresAt: { lt: new Date() }
    }
  });

  const token = crypto.randomUUID();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 mins

  await prisma.passwordResetToken.create({
    data: { tokenHash, expiresAt, businessId: business.id }
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const pathname = new URL(req.url).pathname; // e.g. /api/auth/reset/request
  const locale = getLocaleFromPath(pathname); // best-effort; if you call from /en/... this works
  const resetLink = `${baseUrl}/${locale}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendResetPasswordEmail({
      to: business.ownerEmail,
      resetLink
    });
  } catch (e) {
    // don't leak; just log server-side
    console.error("[reset-request] email send failed", e);
  }

  return NextResponse.json({ ok: true });
}


