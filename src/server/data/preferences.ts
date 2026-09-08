import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Cached per-request so pages that both render currency-formatted numbers and check other prefs don't double-query. */
export const getUserCurrency = cache(async (userId: string): Promise<string> => {
  const preference = await prisma.userPreference.findUnique({ where: { userId }, select: { currency: true } });
  return preference?.currency ?? "USD";
});
