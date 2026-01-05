import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth-constants";
import { hashToken } from "@/lib/customer-auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = body.name ? String(body.name).trim() : null;
  const phone = body.phone ? String(body.phone).trim() : null;

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const exists = await prisma.customer.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Account already exists. Please log in." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const customer = await prisma.customer.create({
    data: { email, passwordHash, name: name || undefined, phone: phone || undefined },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  });

  // session
  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  await prisma.customerSession.create({
    data: { tokenHash, expiresAt, customerId: customer.id },
  });

  const res = NextResponse.json({ ok: true, customer });
  res.cookies.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return res;
}
