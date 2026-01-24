import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // ✅ www -> non-www
  if (url.hostname === "www.slottick.com") {
    url.hostname = "slottick.com";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

// run for all routes except next internals
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"]
};
