import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/auth-constants";

import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.delete({ where: { tokenHash } }).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set(COOKIE_NAME, "", {
    path: "/",
    expires: new Date(0)
  });

  return res;
}
