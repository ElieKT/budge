import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TransactionFilter } from "@/lib/validation/transaction";

const PAGE_SIZE = 25;

export async function getFilteredTransactions(userId: string, filter: TransactionFilter) {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filter.type !== "ALL") where.type = filter.type;
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.from || filter.to) {
    where.date = {
      ...(filter.from ? { gte: new Date(filter.from) } : {}),
      ...(filter.to ? { lte: new Date(filter.to) } : {}),
    };
  }
  if (filter.search) {
    where.OR = [
      { description: { contains: filter.search, mode: "insensitive" } },
      { merchant: { contains: filter.search, mode: "insensitive" } },
      { notes: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    filter.sort === "date_asc"
      ? { date: "asc" }
      : filter.sort === "amount_desc"
        ? { amount: "desc" }
        : filter.sort === "amount_asc"
          ? { amount: "asc" }
          : { date: "desc" };

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy,
      include: { category: true },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return {
    transactions,
    total,
    page: filter.page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}
