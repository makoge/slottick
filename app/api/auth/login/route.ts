import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { hashToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/auth-constants";
import { hasValidOrigin } from "@/lib/request-security";

const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 10;
const SESSION_DAYS = 14;

const INVALID_LOGIN_MESSAGE = "Invalid email or password";

export async function POST(req: Request) {
  if (!hasValidOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: INVALID_LOGIN_MESSAGE }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { ownerEmail: email }
  });

  // keep response generic
  if (!business) {
    return NextResponse.json({ error: INVALID_LOGIN_MESSAGE }, { status: 401 });
  }

  // optional verified email gate
  // if (!business.emailVerifiedAt) {
  //   return NextResponse.json({ error: "Please verify your email first." }, { status: 403 });
  // }

  if (business.lockUntil && business.lockUntil.getTime() > Date.now()) {
    return NextResponse.json({ error: INVALID_LOGIN_MESSAGE }, { status: 429 });
  }

  const passwordOk = await bcrypt.compare(password, business.passwordHash);

  if (!passwordOk) {
    const nextCount = (business.failedLoginCount ?? 0) + 1;
    const shouldLock = nextCount >= MAX_ATTEMPTS;

    await prisma.business.update({
      where: { id: business.id },
      data: {
        failedLoginCount: nextCount,
        lockUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null
      }
    });

    return NextResponse.json({ error: INVALID_LOGIN_MESSAGE }, { status: shouldLock ? 429 : 401 });
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { failedLoginCount: 0, lockUntil: null }
  });

  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_DAYS);

  await prisma.session.create({
    data: { tokenHash, expiresAt, businessId: business.id }
  });

  const res = NextResponse.json({ ok: true });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_DAYS * 24 * 60 * 60
  });

  return res;
}