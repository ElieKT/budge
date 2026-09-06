import { describe, expect, it, vi, beforeEach } from "vitest";

// Mocks must be declared before importing the module under test.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRequireUserId = vi.fn();
vi.mock("@/lib/auth-guard", () => ({ requireUserId: mockRequireUserId }));

const prismaMock = {
  transaction: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  category: { findFirst: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { createTransaction, updateTransaction, deleteTransaction } = await import(
  "@/server/actions/transactions"
);

const CURRENT_USER = "user_me";
const OTHER_USERS_TRANSACTION_ID = "tx_belongs_to_someone_else";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUserId.mockResolvedValue(CURRENT_USER);
});

describe("createTransaction", () => {
  it("rejects invalid input before touching the database", async () => {
    const result = await createTransaction(undefined, formData({ type: "EXPENSE", date: "2026-01-15" })); // missing amount
    expect(result.ok).toBe(false);
    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });

  it("creates a transaction scoped to the authenticated user, converting the amount to integer cents", async () => {
    prismaMock.transaction.create.mockResolvedValue({ id: "tx_1" });
    const result = await createTransaction(
      undefined,
      formData({ type: "EXPENSE", amount: "42.50", date: "2026-01-15", merchant: "Trader Joe's" }),
    );

    expect(result.ok).toBe(true);
    expect(prismaMock.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: CURRENT_USER, amount: 4250, type: "EXPENSE" }),
      }),
    );
  });

  it("refuses to attach a category that doesn't belong to the user (cross-user category injection)", async () => {
    prismaMock.category.findFirst.mockResolvedValue(null); // not found for this user or as a default
    const result = await createTransaction(
      undefined,
      formData({ type: "EXPENSE", amount: "10", date: "2026-01-15", categoryId: "someone_elses_category" }),
    );

    expect(result.ok).toBe(false);
    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });
});

describe("updateTransaction — user-level data isolation", () => {
  it("refuses to update a transaction owned by a different user", async () => {
    // findFirst is always called with { id, userId: CURRENT_USER } — a transaction
    // owned by someone else will never match, so it resolves null here.
    prismaMock.transaction.findFirst.mockResolvedValue(null);

    const result = await updateTransaction(
      OTHER_USERS_TRANSACTION_ID,
      undefined,
      formData({ type: "EXPENSE", amount: "10", date: "2026-01-15" }),
    );

    expect(result.ok).toBe(false);
    expect(prismaMock.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: OTHER_USERS_TRANSACTION_ID, userId: CURRENT_USER },
    });
    expect(prismaMock.transaction.update).not.toHaveBeenCalled();
  });

  it("updates a transaction the user owns", async () => {
    prismaMock.transaction.findFirst.mockResolvedValue({ id: "tx_1", userId: CURRENT_USER });
    prismaMock.transaction.update.mockResolvedValue({ id: "tx_1" });

    const result = await updateTransaction(
      "tx_1",
      undefined,
      formData({ type: "INCOME", amount: "100", date: "2026-01-15" }),
    );

    expect(result.ok).toBe(true);
    expect(prismaMock.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "tx_1" }, data: expect.objectContaining({ amount: 10000 }) }),
    );
  });
});

describe("deleteTransaction — user-level data isolation", () => {
  it("refuses to delete a transaction owned by a different user", async () => {
    prismaMock.transaction.findFirst.mockResolvedValue(null);
    const result = await deleteTransaction(OTHER_USERS_TRANSACTION_ID);
    expect(result.ok).toBe(false);
    expect(prismaMock.transaction.delete).not.toHaveBeenCalled();
  });

  it("deletes a transaction the user owns", async () => {
    prismaMock.transaction.findFirst.mockResolvedValue({ id: "tx_1", userId: CURRENT_USER });
    prismaMock.transaction.delete.mockResolvedValue({ id: "tx_1" });
    const result = await deleteTransaction("tx_1");
    expect(result.ok).toBe(true);
    expect(prismaMock.transaction.delete).toHaveBeenCalledWith({ where: { id: "tx_1" } });
  });
});
