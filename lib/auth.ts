import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { COOKIE_NAME } from "@/lib/auth-constants";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getAuthedBusiness() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true,
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          website: true,
          category: true,
          city: true,
          country: true,
          ownerEmail: true,
          emailVerifiedAt: true
        }
      }
    }
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { tokenHash } }).catch(() => {});
    return null;
  }

  // ✅ optional: block until verified
  // if (!session.business.emailVerifiedAt) return null;

  return session.business;
}
