import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const isProtectedPath = (pathname: string) => pathname.startsWith("/home");

const isGuestOnlyPath = (pathname: string) =>
  pathname === "/login" || pathname === "/signup";

export const middleware = (request: NextRequest) => {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (!sessionCookie && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && isGuestOnlyPath(pathname)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/home/:path*", "/login", "/signup"],
};
