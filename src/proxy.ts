import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const nextPath = `${pathname}${search}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-baguette-path", nextPath);

  if (pathname.startsWith("/app") && !request.cookies.get(SESSION_COOKIE)?.value) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", nextPath);
    return NextResponse.redirect(login);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/app/:path*"],
};
