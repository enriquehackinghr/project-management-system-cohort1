import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/app")) {
    return NextResponse.next();
  }
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const start = new URL("/start", request.url);
    start.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(start);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
