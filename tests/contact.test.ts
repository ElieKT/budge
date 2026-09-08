import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRequireAdmin = vi.fn();
vi.mock("@/lib/auth-guard", () => ({ requireAdmin: mockRequireAdmin }));

const prismaMock = {
  contactMessage: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { submitContactMessage, setMessageResolved } = await import("@/server/actions/contact");

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitContactMessage", () => {
  it("stores a valid message", async () => {
    prismaMock.contactMessage.create.mockResolvedValue({});
    const result = await submitContactMessage(
      undefined,
      formData({ name: "Jamie", email: "jamie@example.com", message: "Quick question about budgets." }),
    );
    expect(result.ok).toBe(true);
    expect(prismaMock.contactMessage.create).toHaveBeenCalledWith({
      data: { name: "Jamie", email: "jamie@example.com", message: "Quick question about budgets." },
    });
  });

  it("rejects an invalid email without storing anything", async () => {
    const result = await submitContactMessage(undefined, formData({ name: "Jamie", email: "not-an-email", message: "Hi" }));
    expect(result.ok).toBe(false);
    expect(prismaMock.contactMessage.create).not.toHaveBeenCalled();
  });

  it("rejects an empty message", async () => {
    const result = await submitContactMessage(undefined, formData({ name: "Jamie", email: "jamie@example.com", message: "" }));
    expect(result.ok).toBe(false);
    expect(prismaMock.contactMessage.create).not.toHaveBeenCalled();
  });

  it("silently pretends success when the honeypot field is filled, without storing anything", async () => {
    const result = await submitContactMessage(
      undefined,
      formData({ name: "Bot", email: "bot@example.com", message: "spam", company: "Acme" }),
    );
    expect(result.ok).toBe(true);
    expect(prismaMock.contactMessage.create).not.toHaveBeenCalled();
  });
});

describe("setMessageResolved", () => {
  it("requires admin access", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("not admin"));
    await expect(setMessageResolved("m1", true)).rejects.toThrow();
    expect(prismaMock.contactMessage.update).not.toHaveBeenCalled();
  });

  it("toggles resolution for an admin", async () => {
    mockRequireAdmin.mockResolvedValue("admin_1");
    prismaMock.contactMessage.findUnique.mockResolvedValue({ id: "m1" });
    prismaMock.contactMessage.update.mockResolvedValue({});

    const result = await setMessageResolved("m1", true);
    expect(result.ok).toBe(true);
    expect(prismaMock.contactMessage.update).toHaveBeenCalledWith({ where: { id: "m1" }, data: { isResolved: true } });
  });

  it("errors when the message doesn't exist", async () => {
    mockRequireAdmin.mockResolvedValue("admin_1");
    prismaMock.contactMessage.findUnique.mockResolvedValue(null);

    const result = await setMessageResolved("missing", true);
    expect(result.ok).toBe(false);
    expect(prismaMock.contactMessage.update).not.toHaveBeenCalled();
  });
});
