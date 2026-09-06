import "server-only";
import { prisma } from "@/lib/prisma";
import type { TransactionType } from "@prisma/client";

/** Every category visible to a user: system defaults (userId null) + their own. */
export function getCategoriesForUser(userId: string, kind?: TransactionType) {
  return prisma.category.findMany({
    where: { OR: [{ userId }, { userId: null }], ...(kind ? { kind } : {}) },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}
