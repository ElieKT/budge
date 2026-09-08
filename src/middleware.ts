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
// Reachable by everyone, logged in or not — a signed-in user isn't
// redirected away from these the way they are from /login etc.
const ALWAYS_PUBLIC_PAGES = ["/help", "/privacy", "/terms", "/security", "/changelog"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isHomePage = pathname === "/";
  const isAlwaysPublicPage = ALWAYS_PUBLIC_PAGES.some((p) => pathname.startsWith(p));

  if (isLoggedIn && (isAuthPage || isHomePage)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (!isLoggedIn && !isAuthPage && !isHomePage && !isAlwaysPublicPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed in but not an admin — bounce away from /admin entirely rather
  // than letting them hit a page that will just redirect/throw itself.
  // (This is a routing convenience, not the authorization boundary itself —
  // requireAdmin() in the admin layout and every admin action re-checks.)
  if (isLoggedIn && pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Protects everything except static assets, NextAuth's own routes, and
  // the cron endpoint (authenticated by bearer token instead). "/",
  // "/login", "/register", "/forgot-password", "/reset-password/*",
  // "/help", "/privacy", and "/terms" are intentionally reachable and
  // handled above.
  matcher: ["/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
