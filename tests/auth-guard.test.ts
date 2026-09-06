import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: mockAuth }));

const { requireUserId, requireAdmin, UnauthorizedError } = await import("@/lib/auth-guard");

beforeEach(() => {
  mockAuth.mockReset();
});

describe("requireUserId", () => {
  it("throws UnauthorizedError when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireUserId()).rejects.toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when the session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    await expect(requireUserId()).rejects.toThrow(UnauthorizedError);
  });

  it("returns the user id from a valid session", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_123" } });
    await expect(requireUserId()).resolves.toBe("user_123");
  });
});

describe("requireAdmin", () => {
  it("throws UnauthorizedError for a signed-in non-admin user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_123", role: "USER" } });
    await expect(requireAdmin()).rejects.toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when signed out", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow(UnauthorizedError);
  });

  it("succeeds for an admin user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } });
    await expect(requireAdmin()).resolves.toBe("admin_1");
  });
});
