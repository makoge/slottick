import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth-constants";
import { hashToken } from "@/lib/customer-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, customer.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // new session
  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await prisma.customerSession.create({
    data: { tokenHash, expiresAt, customerId: customer.id },
  });

  const res = NextResponse.json({
    ok: true,
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      createdAt: customer.createdAt,
    },
  });

  res.cookies.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return res;
}

