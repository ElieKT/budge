import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRequireUserId = vi.fn();
vi.mock("@/lib/auth-guard", () => ({ requireUserId: mockRequireUserId }));

const prismaMock = {
  category: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  savingsGoal: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { updateCategory, deleteCategory } = await import("@/server/actions/categories");
const { updateSavingsGoal, deleteSavingsGoal, updateSavingsProgress } = await import(
  "@/server/actions/savingsGoals"
);

const CURRENT_USER = "user_me";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUserId.mockResolvedValue(CURRENT_USER);
});

describe("category ownership", () => {
  it("refuses to edit a category belonging to another user (or a system default)", async () => {
    prismaMock.category.findFirst.mockResolvedValue(null);
    const result = await updateCategory("someone_elses_category", undefined, formData({ name: "Hacked", kind: "EXPENSE" }));
    expect(result.ok).toBe(false);
    expect(prismaMock.category.update).not.toHaveBeenCalled();
  });

  it("refuses to delete a category belonging to another user", async () => {
    prismaMock.category.findFirst.mockResolvedValue(null);
    const result = await deleteCategory("someone_elses_category");
    expect(result.ok).toBe(false);
    expect(prismaMock.category.delete).not.toHaveBeenCalled();
  });

  it("scopes the ownership lookup to the authenticated user's id", async () => {
    prismaMock.category.findFirst.mockResolvedValue({ id: "cat_1", userId: CURRENT_USER });
    prismaMock.category.delete.mockResolvedValue({});
    await deleteCategory("cat_1");
    expect(prismaMock.category.findFirst).toHaveBeenCalledWith({ where: { id: "cat_1", userId: CURRENT_USER } });
  });
});

describe("savings goal ownership", () => {
  it("refuses to update another user's savings goal", async () => {
    prismaMock.savingsGoal.findFirst.mockResolvedValue(null);
    const result = await updateSavingsGoal(
      "someone_elses_goal",
      undefined,
      formData({ name: "Hacked", targetAmount: "100" }),
    );
    expect(result.ok).toBe(false);
    expect(prismaMock.savingsGoal.update).not.toHaveBeenCalled();
  });

  it("refuses to update progress on another user's savings goal", async () => {
    prismaMock.savingsGoal.findFirst.mockResolvedValue(null);
    const result = await updateSavingsProgress("someone_elses_goal", undefined, formData({ currentAmount: "500" }));
    expect(result.ok).toBe(false);
    expect(prismaMock.savingsGoal.update).not.toHaveBeenCalled();
  });

  it("refuses to delete another user's savings goal", async () => {
    prismaMock.savingsGoal.findFirst.mockResolvedValue(null);
    const result = await deleteSavingsGoal("someone_elses_goal");
    expect(result.ok).toBe(false);
    expect(prismaMock.savingsGoal.delete).not.toHaveBeenCalled();
  });

  it("marks a goal completed and clamps currentAmount up to the target when saving", async () => {
    prismaMock.savingsGoal.findFirst.mockResolvedValue({
      id: "goal_1",
      userId: CURRENT_USER,
      targetAmount: 100000,
      currentAmount: 50000,
    });
    prismaMock.savingsGoal.update.mockResolvedValue({});
    await updateSavingsProgress("goal_1", undefined, formData({ currentAmount: "1000" }));
    expect(prismaMock.savingsGoal.update).toHaveBeenCalledWith({
      where: { id: "goal_1" },
      data: { currentAmount: 100000, isCompleted: true },
    });
  });
});
