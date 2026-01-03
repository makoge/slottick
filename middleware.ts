import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "slotta_session";

function getLocale(pathname: string) {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg || "en";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // protect dashboard + owner api routes
  const protectedPaths =
    pathname.includes("/dashboard") || pathname.startsWith("/api/owner");

  if (!protectedPaths) return NextResponse.next();

  const locale = getLocale(pathname);
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:locale/dashboard/:path*", "/api/owner/:path*"]
};

