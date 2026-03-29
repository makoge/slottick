import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/auth-constants";
import { cookies } from "next/headers";
import { hasValidOrigin } from "@/lib/request-security";


export async function POST(req: Request) {
   if (!hasValidOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
 
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.delete({ where: { tokenHash } }).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0
  });

  return res;
}
