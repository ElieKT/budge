import type { NextAuthConfig } from "next-auth";

/**
 * The subset of the Auth.js config that's safe to bundle into
 * `src/middleware.ts`, which Next.js runs on the Edge runtime by default.
 * Deliberately excludes the Credentials provider (its `authorize` pulls in
 * `bcryptjs`, a Node-only API) and the Prisma adapter (Prisma's engine also
 * isn't Edge-compatible) — middleware only ever needs to decode the
 * already-issued session JWT, never to run a fresh sign-in or touch the
 * database, so neither is actually needed there. `src/auth.ts` extends
 * this with both for use in Server Actions and Route Handlers, which run
 * on the regular Node runtime.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
};
