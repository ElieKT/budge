import { describe, expect, it, vi, beforeEach } from "vitest";

const prismaMock = {
  transaction: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { getFilteredTransactions } = await import("@/server/data/transactions");
const { transactionFilterSchema } = await import("@/lib/validation/transaction");

const CURRENT_USER = "user_me";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.transaction.count.mockResolvedValue(0);
  prismaMock.transaction.findMany.mockResolvedValue([]);
});

describe("getFilteredTransactions", () => {
  it("always scopes the query to the requested user, regardless of filters", async () => {
    const filter = transactionFilterSchema.parse({});
    await getFilteredTransactions(CURRENT_USER, filter);

    const whereArgUsed = prismaMock.transaction.findMany.mock.calls[0]![0].where;
    expect(whereArgUsed.userId).toBe(CURRENT_USER);
    expect(prismaMock.transaction.count.mock.calls[0]![0].where.userId).toBe(CURRENT_USER);
  });

  it("applies a date range filter", async () => {
    const filter = transactionFilterSchema.parse({ from: "2026-01-01", to: "2026-01-31" });
    await getFilteredTransactions(CURRENT_USER, filter);
    const where = prismaMock.transaction.findMany.mock.calls[0]![0].where;
    expect(where.date.gte).toEqual(new Date("2026-01-01"));
    expect(where.date.lte).toEqual(new Date("2026-01-31"));
  });

  it("applies a transaction type filter", async () => {
    const filter = transactionFilterSchema.parse({ type: "INCOME" });
    await getFilteredTransactions(CURRENT_USER, filter);
    expect(prismaMock.transaction.findMany.mock.calls[0]![0].where.type).toBe("INCOME");
  });

  it("omits the type filter entirely for 'ALL' rather than an impossible constraint", async () => {
    const filter = transactionFilterSchema.parse({ type: "ALL" });
    await getFilteredTransactions(CURRENT_USER, filter);
    expect(prismaMock.transaction.findMany.mock.calls[0]![0].where.type).toBeUndefined();
  });

  it("paginates using the requested page and a fixed page size", async () => {
    const filter = transactionFilterSchema.parse({ page: "3" });
    await getFilteredTransactions(CURRENT_USER, filter);
    const call = prismaMock.transaction.findMany.mock.calls[0]![0];
    expect(call.skip).toBe(50); // (page 3 - 1) * pageSize 25
    expect(call.take).toBe(25);
  });

  it("computes totalPages from the total count", async () => {
    prismaMock.transaction.count.mockResolvedValue(53);
    const filter = transactionFilterSchema.parse({});
    const result = await getFilteredTransactions(CURRENT_USER, filter);
    expect(result.totalPages).toBe(3); // ceil(53 / 25)
  });
});
