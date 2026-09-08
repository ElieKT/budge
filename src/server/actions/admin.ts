"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResult, okResult, type ActionResult } from "@/server/action-result";

export async function setUserRole(targetUserId: string, role: "USER" | "ADMIN"): Promise<ActionResult> {
  const adminId = await requireAdmin();
  if (targetUserId === adminId && role === "USER") {
    return errorResult("You can't remove your own admin access.");
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { role } });
  revalidatePath("/admin/users");
  return okResult(undefined);
}
