import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "slotta_session";

function getLocale(pathname: string) {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg || "en";
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = getLocale(pathname);

  // ✅ protect only the actual dashboard route under locale
  const isDashboard = pathname === `/${locale}/dashboard` || pathname.startsWith(`/${locale}/dashboard/`);
  const isOwnerApi = pathname.startsWith("/api/owner/");

  if (!isDashboard && !isOwnerApi) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:locale/dashboard/:path*", "/api/owner/:path*"],
};
