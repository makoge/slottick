import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // 1) www -> non-www
  if (url.hostname === "www.slottick.com") {
    url.hostname = "slottick.com";
    return NextResponse.redirect(url, 308);
  }

  const pathname = url.pathname;

  // skip next internals + files
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 2) ensure locale prefix
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (!hasLocale) {
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
