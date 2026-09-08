import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRequireUserId = vi.fn();
vi.mock("@/lib/auth-guard", () => ({ requireUserId: mockRequireUserId }));

const prismaMock = {
  householdMember: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), delete: vi.fn(), update: vi.fn() },
  household: { findUniqueOrThrow: vi.fn(), delete: vi.fn() },
  user: { findUnique: vi.fn() },
  sharedExpense: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { addHouseholdMember, createSharedExpense, removeHouseholdMember } = await import(
  "@/server/actions/household"
);

const OUTSIDER = "user_outsider";
const HOUSEHOLD_ID = "household_1";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUserId.mockResolvedValue(OUTSIDER);
});

describe("household membership isolation", () => {
  it("refuses to add a member to a household the caller doesn't belong to", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue(null); // caller is not a member

    await expect(
      addHouseholdMember(HOUSEHOLD_ID, undefined, formData({ email: "someone@example.com" })),
    ).rejects.toThrow(/not a member/i);

    expect(prismaMock.householdMember.create).not.toHaveBeenCalled();
  });

  it("refuses to add a shared expense to a household the caller doesn't belong to", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue(null);

    await expect(
      createSharedExpense(
        HOUSEHOLD_ID,
        undefined,
        formData({
          description: "Groceries",
          amount: "50",
          date: "2026-01-01",
          splits: JSON.stringify([{ userId: OUTSIDER, shareAmount: "50" }]),
        }),
      ),
    ).rejects.toThrow(/not a member/i);

    expect(prismaMock.sharedExpense.create).not.toHaveBeenCalled();
  });

  it("rejects a shared expense with a split against a user who isn't actually a household member", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue({ householdId: HOUSEHOLD_ID, userId: OUTSIDER, role: "MEMBER" });
    prismaMock.householdMember.findMany.mockResolvedValue([{ userId: OUTSIDER }]); // only the caller is a real member

    const result = await createSharedExpense(
      HOUSEHOLD_ID,
      undefined,
      formData({
        description: "Rent",
        amount: "100",
        date: "2026-01-01",
        splits: JSON.stringify([
          { userId: OUTSIDER, shareAmount: "50" },
          { userId: "not_a_member", shareAmount: "50" },
        ]),
      }),
    );

    expect(result.ok).toBe(false);
    expect(prismaMock.sharedExpense.create).not.toHaveBeenCalled();
  });

  it("rejects splits that don't add up to the total amount", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue({ householdId: HOUSEHOLD_ID, userId: OUTSIDER, role: "MEMBER" });
    prismaMock.householdMember.findMany.mockResolvedValue([{ userId: OUTSIDER }]);

    const result = await createSharedExpense(
      HOUSEHOLD_ID,
      undefined,
      formData({
        description: "Utilities",
        amount: "100",
        date: "2026-01-01",
        splits: JSON.stringify([{ userId: OUTSIDER, shareAmount: "40" }]), // doesn't sum to 100
      }),
    );

    expect(result.ok).toBe(false);
    expect(prismaMock.sharedExpense.create).not.toHaveBeenCalled();
  });

  it("only lets the household owner remove a different member", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue({ householdId: HOUSEHOLD_ID, userId: OUTSIDER, role: "MEMBER" });

    const result = await removeHouseholdMember(HOUSEHOLD_ID, "someone_else");

    expect(result.ok).toBe(false);
    expect(prismaMock.householdMember.delete).not.toHaveBeenCalled();
  });

  it("lets any member remove themselves", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue({ householdId: HOUSEHOLD_ID, userId: OUTSIDER, role: "MEMBER" });
    prismaMock.householdMember.delete.mockResolvedValue({});
    // An owner remains after the caller leaves — no promotion, no household deletion.
    prismaMock.householdMember.findMany.mockResolvedValue([{ id: "m_owner", userId: "someone_else", role: "OWNER" }]);

    const result = await removeHouseholdMember(HOUSEHOLD_ID, OUTSIDER);

    expect(result.ok).toBe(true);
    expect(prismaMock.householdMember.delete).toHaveBeenCalled();
    expect(prismaMock.householdMember.update).not.toHaveBeenCalled();
    expect(prismaMock.household.delete).not.toHaveBeenCalled();
  });

  it("promotes the longest-standing member to owner when the owner leaves", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue({ householdId: HOUSEHOLD_ID, userId: OUTSIDER, role: "OWNER" });
    prismaMock.householdMember.delete.mockResolvedValue({});
    prismaMock.householdMember.findMany.mockResolvedValue([{ id: "m_next", userId: "next_member", role: "MEMBER" }]);

    const result = await removeHouseholdMember(HOUSEHOLD_ID, OUTSIDER);

    expect(result.ok).toBe(true);
    expect(prismaMock.householdMember.update).toHaveBeenCalledWith({ where: { id: "m_next" }, data: { role: "OWNER" } });
    expect(prismaMock.household.delete).not.toHaveBeenCalled();
  });

  it("deletes the household when the last member leaves", async () => {
    prismaMock.householdMember.findUnique.mockResolvedValue({ householdId: HOUSEHOLD_ID, userId: OUTSIDER, role: "OWNER" });
    prismaMock.householdMember.delete.mockResolvedValue({});
    prismaMock.householdMember.findMany.mockResolvedValue([]);

    const result = await removeHouseholdMember(HOUSEHOLD_ID, OUTSIDER);

    expect(result.ok).toBe(true);
    expect(prismaMock.household.delete).toHaveBeenCalledWith({ where: { id: HOUSEHOLD_ID } });
    expect(prismaMock.householdMember.update).not.toHaveBeenCalled();
  });
});
