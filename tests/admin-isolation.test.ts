import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRequireAdmin = vi.fn();
vi.mock("@/lib/auth-guard", () => ({ requireAdmin: mockRequireAdmin }));

const prismaMock = {
  user: { update: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { setUserRole } = await import("@/server/actions/admin");

const ADMIN_ID = "admin_1";
const OTHER_USER_ID = "user_2";

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue(ADMIN_ID);
});

describe("setUserRole", () => {
  it("lets an admin promote another user", async () => {
    prismaMock.user.update.mockResolvedValue({});
    const result = await setUserRole(OTHER_USER_ID, "ADMIN");
    expect(result.ok).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: OTHER_USER_ID }, data: { role: "ADMIN" } });
  });

  it("lets an admin demote another admin", async () => {
    prismaMock.user.update.mockResolvedValue({});
    const result = await setUserRole(OTHER_USER_ID, "USER");
    expect(result.ok).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: OTHER_USER_ID }, data: { role: "USER" } });
  });

  it("refuses to let an admin remove their own admin access", async () => {
    const result = await setUserRole(ADMIN_ID, "USER");
    expect(result.ok).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("allows an admin to re-affirm their own admin role (no-op case)", async () => {
    prismaMock.user.update.mockResolvedValue({});
    const result = await setUserRole(ADMIN_ID, "ADMIN");
    expect(result.ok).toBe(true);
  });
});
