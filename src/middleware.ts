import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Built from the Edge-safe authConfig, not `@/auth` — importing the full
// config here (Credentials provider + Prisma adapter) would pull
// bcryptjs and Prisma's engine into the Edge middleware bundle, where
// neither runs. Middleware only decodes the already-issued session JWT,
// which authConfig's callbacks alone are sufficient for.
const { auth } = NextAuth(authConfig);

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isPublicMarketingPage = pathname === "/";

  if (isLoggedIn && (isAuthPage || isPublicMarketingPage)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (!isLoggedIn && !isAuthPage && !isPublicMarketingPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Protects everything except static assets, NextAuth's own routes, and
  // the cron endpoint (authenticated by bearer token instead). "/",
  // "/login", "/register", "/forgot-password", "/reset-password/*" are
  // intentionally reachable and handled above.
  matcher: ["/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
