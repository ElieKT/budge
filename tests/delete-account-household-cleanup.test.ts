import { describe, expect, it, vi, beforeEach } from "vitest";

const mockRequireUserId = vi.fn();
vi.mock("@/lib/auth-guard", () => ({ requireUserId: mockRequireUserId }));

const mockSignOut = vi.fn();
vi.mock("@/auth", () => ({ signIn: vi.fn(), signOut: mockSignOut }));
// auth.ts imports AuthError from the real "next-auth" package (not just the
// local @/auth wrapper) purely for an instanceof check on login failure —
// stub the package itself so Vitest never has to load its Next.js internals.
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

vi.mock("@/lib/email", () => ({ sendPasswordResetEmail: vi.fn() }));

const prismaMock = {
  user: { delete: vi.fn() },
  householdMember: { findMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const mockReconcile = vi.fn();
vi.mock("@/server/data/household", () => ({ reconcileHouseholdAfterMemberLeft: mockReconcile }));

const { deleteAccount } = await import("@/server/actions/auth");

const USER_ID = "user_1";

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUserId.mockResolvedValue(USER_ID);
});

describe("deleteAccount", () => {
  it("reconciles every household the user belonged to, after the cascading delete", async () => {
    prismaMock.householdMember.findMany.mockResolvedValue([{ householdId: "h1" }, { householdId: "h2" }]);
    prismaMock.user.delete.mockResolvedValue({});

    await deleteAccount();

    // The user row (and its cascading FKs) must be gone before we reconcile,
    // since reconciliation re-queries remaining members from the DB.
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: USER_ID } });
    expect(mockReconcile).toHaveBeenCalledWith("h1");
    expect(mockReconcile).toHaveBeenCalledWith("h2");
    expect(mockReconcile).toHaveBeenCalledTimes(2);
  });

  it("doesn't touch household reconciliation when the user isn't in any household", async () => {
    prismaMock.householdMember.findMany.mockResolvedValue([]);
    prismaMock.user.delete.mockResolvedValue({});

    await deleteAccount();

    expect(mockReconcile).not.toHaveBeenCalled();
  });
});
