import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { COOKIE_NAME } from "@/lib/auth-constants";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getAuthedBusiness() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { business: true }
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { tokenHash } }).catch(() => {});
    return null;
  }

  return session.business;
}
