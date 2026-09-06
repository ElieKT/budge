import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("You must be signed in to do that.");
    this.name = "UnauthorizedError";
  }
}

/**
 * Every server action and route handler that touches user-owned data MUST
 * call this first and use the returned id in every Prisma `where` clause.
 * Never trust a userId passed from the client — always read it from the
 * server-verified session.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user.id;
}

export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new UnauthorizedError();
  }
  return session.user.id;
}
